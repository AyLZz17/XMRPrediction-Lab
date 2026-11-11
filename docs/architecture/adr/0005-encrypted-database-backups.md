# ADR 0005: Encrypted database backups by email

- Status: Accepted
- Date: 2026-11-11

## Context

The user and service-owned databases need periodic off-host backups. The
destination email address and SMTP account are deployment choices, while the
backup contains user identifiers and experimental data. Databases must not be
exposed through the frontend or API Gateway to perform maintenance exports.

## Decision

- Add an opt-in Compose `backup` profile containing a dedicated, non-root
  backup runner outside the request path.
- Export PostgreSQL with `pg_dump` and the two owned MongoDB databases with
  `mongodump`. Use separate read-only accounts for each database; do not use
  the online service accounts or MongoDB administrator account.
- Package the logical dumps and a UTC manifest in a temporary directory.
  Encrypt the package with age before sending it through authenticated,
  certificate-validated SMTP STARTTLS. Only the public age recipient is
  configured in the container; the private identity remains offline.
- Run immediately on startup, then at the configured interval. Retry failed
  delivery/export attempts, log errors, enforce an attachment-size ceiling,
  and delete temporary files after each attempt.
- Keep recipient, SMTP, database backup credentials, interval, and age
  recipient in external environment configuration. Leave the service opt-in
  until the destination account and credentials are designated.
- Exclude Redis because it stores rate-limit counters and temporary state.
  ML service data/model volumes are not part of this database backup job.

## Backup threat controls

| Threat | Control |
|---|---|
| Online service credentials used to read all databases | Dedicated PostgreSQL and per-database MongoDB read-only accounts |
| Database attachment disclosed in transit or at the mailbox | Age encryption before delivery; private identity stored offline |
| SMTP interception or credential disclosure | STARTTLS with certificate validation and external credentials |
| Unconfigured recipient or oversized attachment reported as success | Fail startup or the backup attempt explicitly and log the cause |
| Undetected unusable backup | Quarterly restore drill is required before relying on the workflow |

## Consequences

- The backup service can only access the two database engines on the private
  Compose network; it exposes no HTTP port and mounts no persistent archive
  volume.
- Existing database volumes do not rerun initialization scripts. Operators
  must apply the backup-account scripts once during a maintenance window.
- A default 24-hour interval has a nominal RPO of 24 hours; no RTO is promised.
- Email attachment limits constrain the supported backup size. Oversized
  archives are rejected and logged rather than silently omitted.
- Redis and Monero volume recovery require separate operational policies.
