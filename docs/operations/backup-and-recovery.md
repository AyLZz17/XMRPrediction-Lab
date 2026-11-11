# Database backup and recovery

The optional `backup-service` protects the PostgreSQL user database and the
separate `market_service` and `prediction_service` MongoDB databases. Redis is
ephemeral and is not included. The Monero data/model volumes are outside this
database backup workflow.

## Configure and start

1. Copy `.env.example` to `.env` and set independent random passwords for the
   PostgreSQL and MongoDB backup-reader accounts.
2. Configure `BACKUP_SMTP_HOST`, `BACKUP_SMTP_USERNAME`,
   `BACKUP_SMTP_PASSWORD`, `BACKUP_SMTP_FROM`, and the designated
   `BACKUP_EMAIL_TO`. SMTP uses certificate-validated STARTTLS on port 587 by
   default.
3. Generate an age identity in a secure offline location with `age-keygen`.
   Put only its public `age1...` recipient in `BACKUP_AGE_RECIPIENT`. Keep the
   private identity outside the repository, container, and email account.
4. Configure the database backup-reader credentials in `.env`. On a new
   database volume, the initialization scripts create a PostgreSQL role with
   read-only table/sequence access and separate MongoDB users with `read`
   access limited to their respective databases.
5. Start the optional profile:

   ```powershell
   docker compose --profile backup up -d --build backup-service
   ```

The first backup runs when the service starts. Later backups run every
`BACKUP_INTERVAL_SECONDS` (default: 24 hours); failures are logged and retried
after `BACKUP_RETRY_SECONDS` (default: 15 minutes). A successful backup is
archived in a temporary directory, encrypted with age, attached to an
authenticated SMTP message, and deleted from the container after delivery.
No archive volume is mounted.

Run a one-time backup or inspect scheduler output with:

```powershell
docker compose --profile backup run --rm backup-service --once
docker compose logs --follow backup-service
```

For an existing database volume, Compose initialization scripts do not run
again automatically. After configuring the backup account values, apply the
PostgreSQL role and MongoDB accounts once during a maintenance window:

```powershell
docker compose exec users-db sh /docker-entrypoint-initdb.d/20-create-backup-user.sh
docker compose exec mongodb sh -lc 'mongosh --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /docker-entrypoint-initdb.d/10-init-users.js'
```

The MongoDB script leaves existing application accounts unchanged and creates
only missing accounts. The PostgreSQL script grants the backup role access to
current and future objects owned by the configured application role.

Email providers impose attachment limits. The default maximum encrypted
archive size is 18,000,000 bytes (`BACKUP_MAX_ATTACHMENT_BYTES`); a larger
archive is not emailed and is reported in the service logs. Configure a
provider-compatible limit rather than disabling the size check.

## Restore

Download the encrypted attachment to a trusted recovery host. Decrypt it with
the offline age identity and inspect its contents before restoring:

```powershell
age --decrypt --identity C:\secure\backup-identity.txt --output backup.tar backup.tar.age
tar -tf backup.tar
```

The PostgreSQL dump uses the custom `pg_dump` format. Restore into a clean
database during a maintenance window, using the application database role:

```powershell
pg_restore --no-owner --role=aylzz_app --dbname=aylzz_users users.postgres
```

Restore each MongoDB archive only to its matching service database. Preserve
the archive's namespace and do not point `--drop` at a production database
until the target and recovery plan have been verified:

```powershell
mongorestore --gzip --archive=market_service.archive.gz --drop --uri="<market-service recovery URI>"
mongorestore --gzip --archive=prediction_service.archive.gz --drop --uri="<prediction-service recovery URI>"
```

The logical dumps do not include PostgreSQL global roles or MongoDB user
accounts. Bootstrap the database and service accounts from the configured
initialization scripts before restoring application data. Never put recovery
passwords or the age private key in command history or this repository.

The default schedule implies a nominal RPO of 24 hours. RTO depends on database
size, the mail provider, and recovery infrastructure; it is not guaranteed by
this local Compose setup. Perform and record a restore drill at least quarterly
before treating these backups as disaster recovery.
