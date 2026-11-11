import datetime as dt
import unittest
from email.message import EmailMessage
from pathlib import Path

from backup import ConfigurationError, load_config, run_backup


def valid_environment() -> dict[str, str]:
    return {
        "USERS_DB_BACKUP_USER": "backup_reader",
        "USERS_DB_BACKUP_PASSWORD": "postgres-secret",
        "MONGO_MARKET_BACKUP_USER": "market_backup",
        "MONGO_MARKET_BACKUP_PASSWORD": "market-secret",
        "MONGO_PREDICTION_BACKUP_USER": "prediction_backup",
        "MONGO_PREDICTION_BACKUP_PASSWORD": "prediction-secret",
        "BACKUP_SMTP_HOST": "smtp.example.test",
        "BACKUP_SMTP_USERNAME": "backup@example.test",
        "BACKUP_SMTP_PASSWORD": "smtp-secret",
        "BACKUP_SMTP_FROM": "backup@example.test",
        "BACKUP_EMAIL_TO": "owner@example.test",
        "BACKUP_AGE_RECIPIENT": "age1testrecipient",
    }


class FakeSMTP:
    def __init__(self) -> None:
        self.message: EmailMessage | None = None
        self.tls_enabled = False
        self.logged_in = False

    def __enter__(self) -> "FakeSMTP":
        return self

    def __exit__(self, *_: object) -> None:
        return None

    def ehlo(self) -> None:
        return None

    def starttls(self, **_: object) -> None:
        self.tls_enabled = True

    def login(self, username: str, password: str) -> None:
        self.logged_in = username == "backup@example.test" and password == "smtp-secret"

    def send_message(self, message: EmailMessage) -> None:
        self.message = message


class BackupTests(unittest.TestCase):
    def test_missing_secrets_fail_explicitly(self) -> None:
        with self.assertRaisesRegex(ConfigurationError, "BACKUP_EMAIL_TO"):
            load_config({})

    def test_backup_exports_encrypts_and_sends_over_tls(self) -> None:
        config = load_config(valid_environment())
        smtp = FakeSMTP()
        commands: list[list[str]] = []

        def fake_command(command: list[str], **kwargs: object) -> None:
            commands.append(command)
            if command[0] == "pg_dump":
                destination = Path(command[command.index("--file") + 1])
                destination.write_bytes(b"postgres dump")
            elif command[0] == "mongodump":
                archive_option = next(item for item in command if item.startswith("--archive="))
                destination = Path(archive_option.split("=", 1)[1])
                destination.write_bytes(b"mongo dump")
            elif command[0] == "age":
                destination = Path(command[command.index("--output") + 1])
                destination.write_bytes(b"encrypted archive")
            else:
                self.fail(f"Unexpected command: {command[0]}")

        filename, size = run_backup(
            config,
            command_runner=fake_command,
            smtp_factory=lambda *_args, **_kwargs: smtp,
            now=dt.datetime(2026, 11, 11, tzinfo=dt.timezone.utc),
        )

        self.assertTrue(filename.endswith(".tar.age"))
        self.assertEqual(size, len(b"encrypted archive"))
        self.assertEqual([command[0] for command in commands].count("mongodump"), 2)
        self.assertEqual(commands[-1][0], "age")
        self.assertTrue(smtp.tls_enabled)
        self.assertTrue(smtp.logged_in)
        self.assertIsNotNone(smtp.message)
        assert smtp.message is not None
        self.assertEqual(smtp.message["To"], "owner@example.test")
        self.assertEqual(len(list(smtp.message.iter_attachments())), 1)

    def test_oversized_archive_is_not_emailed(self) -> None:
        environment = valid_environment()
        environment["BACKUP_MAX_ATTACHMENT_BYTES"] = "5"
        config = load_config(environment)
        commands: list[list[str]] = []

        def fake_command(command: list[str], **kwargs: object) -> None:
            commands.append(command)
            if command[0] == "pg_dump":
                Path(command[command.index("--file") + 1]).write_bytes(b"pg")
            elif command[0] == "mongodump":
                archive_option = next(item for item in command if item.startswith("--archive="))
                Path(archive_option.split("=", 1)[1]).write_bytes(b"mongo")
            elif command[0] == "age":
                Path(command[command.index("--output") + 1]).write_bytes(b"too large")

        smtp_called = False

        def smtp_factory(*_args: object, **_kwargs: object) -> FakeSMTP:
            nonlocal smtp_called
            smtp_called = True
            return FakeSMTP()

        with self.assertRaisesRegex(RuntimeError, "above the configured email attachment limit"):
            run_backup(config, command_runner=fake_command, smtp_factory=smtp_factory)
        self.assertFalse(smtp_called)


if __name__ == "__main__":
    unittest.main()
