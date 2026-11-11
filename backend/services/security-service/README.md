# Security service

Spring Boot identity service with PostgreSQL-owned user records, BCrypt password
hashing, versioned Flyway schema, and short-lived HMAC-signed access tokens in
an HttpOnly, SameSite=Strict cookie. `POST /api/auth/register` and
`POST /api/auth/login` issue the cookie; `GET /api/auth/me` validates it and
`POST /api/auth/logout` clears it. The API Gateway routes `/api/auth/*` here.

Copy the root `.env.example` to `.env` and set independent random values for
`USERS_DB_PASSWORD` and `JWT_SECRET` (at least 32 bytes). Do not commit `.env`.
The development workspace may keep a generated, ignored `.env`; production
secrets belong in the deployment secret manager.
The PostgreSQL port is bound to `127.0.0.1:5433` for local DBeaver access:
database `aylzz_users`, user `aylzz_app`, password from `.env`. Set
`COOKIE_SECURE=true` when serving the application over HTTPS.

Run the PostgreSQL-backed integration tests with:

```powershell
mvn test
```
