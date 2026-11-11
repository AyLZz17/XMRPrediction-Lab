# ADR 0002: Spring Boot identity service with PostgreSQL

- Status: Accepted
- Date: 2026-11-10

## Context

The portal needs real registration and login while the existing browser UI and
the `backend/services/ml-service/` model API remain available during
migration. User identity must be isolated from market and prediction storage.

## Decision

- Add a Java 21 / Spring Boot service under
  `backend/services/security-service`.
- Persist normalized email addresses and BCrypt password hashes in a dedicated
  PostgreSQL database named by `SECURITY_DB_NAME` (default `aylzz_identity`).
  Manage schema changes with Flyway.
- Issue 15-minute HMAC-signed tokens in an `HttpOnly`, `SameSite=Strict`
  cookie scoped to `/api`. The cookie's `Secure` attribute is configurable and
  must be enabled behind HTTPS.
- Route `/api/auth/*` through the Node.js/TypeScript API Gateway. Expose the
  PostgreSQL port only on the host loopback interface for local DBeaver use.
- Keep database and signing secrets in an ignored local `.env` or deployment
  secret store; no credentials are committed.

## Consequences

- Registration and login are now persisted and usable without replacing the
  existing frontend.
- Logout removes the browser cookie. Since access tokens are stateless, an
  already copied token remains valid until its short expiry; Redis-backed
  revocation and login rate limits are separate follow-up work.
- Local Docker Compose requires `USERS_DB_PASSWORD` and `JWT_SECRET`. Copy
  `.env.example` to `.env` and replace its placeholders before deployment.
- The database is available at `127.0.0.1:5433` for DBeaver, using the
  database name, user, and password in `.env`.

## Validation

The service is built as a non-root container. Its API was exercised against a
real PostgreSQL container for registration, password verification, cookie
authentication, logout, duplicate-email handling, and invalid credentials.
