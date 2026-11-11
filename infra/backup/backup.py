from __future__ import annotations

import datetime as dt
import email.message
import email.utils
import json
import logging
import os
import re
import smtplib
import ssl
import subprocess
import sys
import tarfile
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable
from urllib.parse import quote

logger = logging.getLogger("aylzz.backup")
database_name_pattern = re.compile(r"^[A-Za-z0-9_]+$")


class ConfigurationError(ValueError):
    pass


class AttachmentTooLargeError(RuntimeError):
    pass


@dataclass(frozen=True)
class BackupConfig:
    users_db_host: str
    users_db_port: int
    users_db_name: str
    users_db_user: str
    users_db_password: str
    mongo_host: str
    mongo_port: int
    mongo_market_user: str
    mongo_market_password: str
    mongo_prediction_user: str
    mongo_prediction_password: str
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    smtp_from: str
    email_to: str
    age_recipient: str
    interval_seconds: int
    retry_seconds: int
    max_attachment_bytes: int


def load_config(environment: dict[str, str] | None = None) -> BackupConfig:
    values = os.environ if environment is None else environment
    required = (
        "USERS_DB_BACKUP_USER",
        "USERS_DB_BACKUP_PASSWORD",
        "MONGO_MARKET_BACKUP_USER",
        "MONGO_MARKET_BACKUP_PASSWORD",
        "MONGO_PREDICTION_BACKUP_USER",
        "MONGO_PREDICTION_BACKUP_PASSWORD",
        "BACKUP_SMTP_HOST",
        "BACKUP_SMTP_USERNAME",
        "BACKUP_SMTP_PASSWORD",
        "BACKUP_SMTP_FROM",
        "BACKUP_EMAIL_TO",
        "BACKUP_AGE_RECIPIENT",
    )
    missing = [name for name in required if not values.get(name, "").strip()]
    if missing:
        raise ConfigurationError(f"Missing required backup settings: {', '.join(missing)}")

    sender = values["BACKUP_SMTP_FROM"].strip()
    recipient = values["BACKUP_EMAIL_TO"].strip()
    if not valid_email(sender) or not valid_email(recipient):
        raise ConfigurationError("BACKUP_SMTP_FROM and BACKUP_EMAIL_TO must be valid email addresses")

    users_db_name = values.get("USERS_DB_NAME", "aylzz_users").strip()
    if not database_name_pattern.fullmatch(users_db_name):
        raise ConfigurationError("USERS_DB_NAME must contain only letters, digits, or underscores")

    return BackupConfig(
        users_db_host=values.get("USERS_DB_HOST", "users-db"),
        users_db_port=read_int(values, "USERS_DB_PORT", 5432, 1, 65535),
        users_db_name=users_db_name,
        users_db_user=values["USERS_DB_BACKUP_USER"].strip(),
        users_db_password=values["USERS_DB_BACKUP_PASSWORD"],
        mongo_host=values.get("MONGO_HOST", "mongodb"),
        mongo_port=read_int(values, "MONGO_PORT", 27017, 1, 65535),
        mongo_market_user=values["MONGO_MARKET_BACKUP_USER"].strip(),
        mongo_market_password=values["MONGO_MARKET_BACKUP_PASSWORD"],
        mongo_prediction_user=values["MONGO_PREDICTION_BACKUP_USER"].strip(),
        mongo_prediction_password=values["MONGO_PREDICTION_BACKUP_PASSWORD"],
        smtp_host=values["BACKUP_SMTP_HOST"].strip(),
        smtp_port=read_int(values, "BACKUP_SMTP_PORT", 587, 1, 65535),
        smtp_username=values["BACKUP_SMTP_USERNAME"].strip(),
        smtp_password=values["BACKUP_SMTP_PASSWORD"],
        smtp_from=sender,
        email_to=recipient,
        age_recipient=values["BACKUP_AGE_RECIPIENT"].strip(),
        interval_seconds=read_int(values, "BACKUP_INTERVAL_SECONDS", 86400, 300),
        retry_seconds=read_int(values, "BACKUP_RETRY_SECONDS", 900, 60),
        max_attachment_bytes=read_int(values, "BACKUP_MAX_ATTACHMENT_BYTES", 18_000_000, 1),
    )


def valid_email(value: str) -> bool:
    return email.utils.parseaddr(value)[1] == value and "@" in value


def read_int(
    values: dict[str, str],
    name: str,
    default: int,
    minimum: int,
    maximum: int = 2_147_483_647,
) -> int:
    try:
        value = int(values.get(name, str(default)))
    except ValueError as error:
        raise ConfigurationError(f"{name} must be an integer") from error
    if not minimum <= value <= maximum:
        raise ConfigurationError(f"{name} must be between {minimum} and {maximum}")
    return value


def run_backup(
    config: BackupConfig,
    command_runner: Callable[..., object] | None = None,
    smtp_factory: Callable[..., smtplib.SMTP] | None = None,
    now: dt.datetime | None = None,
) -> tuple[str, int]:
    run_command = command_runner or subprocess.run
    connect_smtp = smtp_factory or smtplib.SMTP
    timestamp = now or dt.datetime.now(dt.timezone.utc)
    if timestamp.tzinfo is None:
        raise ValueError("Backup timestamp must include a timezone")
    timestamp = timestamp.astimezone(dt.timezone.utc)
    stamp = timestamp.strftime("%Y%m%dT%H%M%SZ")

    with tempfile.TemporaryDirectory(prefix="aylzz-backup-") as temporary_directory:
        workdir = Path(temporary_directory)
        postgres_dump = workdir / "users.postgres"
        dump_postgres(config, postgres_dump, run_command)

        mongo_dumps: list[Path] = []
        for database, username, password in (
            ("market_service", config.mongo_market_user, config.mongo_market_password),
            ("prediction_service", config.mongo_prediction_user, config.mongo_prediction_password),
        ):
            database_config = workdir / f"{database}.yml"
            create_mongo_config(config, database_config, username, password)
            dump_path = workdir / f"{database}.archive.gz"
            run_command(
                [
                    "mongodump",
                    f"--config={database_config}",
                    f"--db={database}",
                    f"--archive={dump_path}",
                    "--gzip",
                ],
                check=True,
                timeout=3600,
            )
            mongo_dumps.append(dump_path)

        manifest = {
            "created_at_utc": timestamp.isoformat().replace("+00:00", "Z"),
            "format": "PostgreSQL custom dump and MongoDB gzip archives",
            "databases": {
                "postgresql": config.users_db_name,
                "mongodb": ["market_service", "prediction_service"],
            },
        }
        manifest_path = workdir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

        archive_path = workdir / f"aylzz-database-backup-{stamp}.tar"
        with tarfile.open(archive_path, "w") as archive:
            archive.add(postgres_dump, arcname=postgres_dump.name)
            for mongo_dump in mongo_dumps:
                archive.add(mongo_dump, arcname=mongo_dump.name)
            archive.add(manifest_path, arcname=manifest_path.name)

        encrypted_path = workdir / f"{archive_path.name}.age"
        run_command(
            ["age", "--recipient", config.age_recipient, "--output", str(encrypted_path), str(archive_path)],
            check=True,
            timeout=300,
        )
        encrypted_size = encrypted_path.stat().st_size
        if encrypted_size > config.max_attachment_bytes:
            raise AttachmentTooLargeError(
                f"Encrypted backup is {encrypted_size} bytes, above the configured "
                f"email attachment limit of {config.max_attachment_bytes} bytes"
            )

        send_email(config, encrypted_path, timestamp, encrypted_size, connect_smtp)
        logger.info("Encrypted database backup sent bytes=%d", encrypted_size)
        return encrypted_path.name, encrypted_size


def dump_postgres(
    config: BackupConfig,
    destination: Path,
    run_command: Callable[..., object],
) -> None:
    environment = os.environ.copy()
    environment["PGPASSWORD"] = config.users_db_password
    run_command(
        [
            "pg_dump",
            "--host", config.users_db_host,
            "--port", str(config.users_db_port),
            "--username", config.users_db_user,
            "--dbname", config.users_db_name,
            "--format=custom",
            "--no-password",
            "--file", str(destination),
        ],
        check=True,
        timeout=3600,
        env=environment,
    )


def create_mongo_config(
    config: BackupConfig,
    destination: Path,
    username: str | None = None,
    password: str | None = None,
) -> None:
    user = username or config.mongo_market_user
    secret = password or config.mongo_market_password
    uri = (
        f"mongodb://{quote(user, safe='')}:{quote(secret, safe='')}"
        f"@{config.mongo_host}:{config.mongo_port}/?authSource=admin"
    )
    destination.write_text(f"uri: {json.dumps(uri)}\n", encoding="utf-8")
    destination.chmod(0o600)


def send_email(
    config: BackupConfig,
    encrypted_path: Path,
    timestamp: dt.datetime,
    size: int,
    smtp_factory: Callable[..., smtplib.SMTP],
) -> None:
    message = email.message.EmailMessage()
    message["Subject"] = f"AyLZz encrypted database backup {timestamp:%Y-%m-%d}"
    message["From"] = config.smtp_from
    message["To"] = config.email_to
    message.set_content(
        "An encrypted database backup is attached.\n"
        f"Created at: {timestamp.isoformat()}\n"
        f"Encrypted size: {size} bytes\n"
        "The archive can be decrypted only with the separately held age identity."
    )
    message.add_attachment(
        encrypted_path.read_bytes(),
        maintype="application",
        subtype="octet-stream",
        filename=encrypted_path.name,
    )

    with smtp_factory(config.smtp_host, config.smtp_port, timeout=30) as smtp:
        smtp.ehlo()
        smtp.starttls(context=ssl.create_default_context())
        smtp.ehlo()
        smtp.login(config.smtp_username, config.smtp_password)
        smtp.send_message(message)


def main(arguments: list[str] | None = None) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    config = load_config()
    command = sys.argv[1:] if arguments is None else arguments
    if command == ["--once"]:
        filename, size = run_backup(config)
        logger.info("One-time backup completed file=%s bytes=%d", filename, size)
        return
    if command:
        raise ConfigurationError("Only the optional --once argument is supported")

    logger.info(
        "Backup scheduler started interval_seconds=%d retry_seconds=%d",
        config.interval_seconds,
        config.retry_seconds,
    )
    while True:
        try:
            run_backup(config)
            delay = config.interval_seconds
        except AttachmentTooLargeError:
            logger.exception("Database backup exceeds the email limit; will retry next interval")
            delay = config.interval_seconds
        except Exception:
            logger.exception("Database backup failed; will retry")
            delay = config.retry_seconds
        time.sleep(delay)


if __name__ == "__main__":
    main()
