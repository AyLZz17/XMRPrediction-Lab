# Backend services and data ownership

```text
Browser -> Nginx (Next.js static UI) -> Node.js/TypeScript API Gateway
                         |-> Spring Boot security -> PostgreSQL: users + auth_audit_events
                         |-> market-service -> MongoDB: market_service.candles + intraday_candles
                         |                                                |-> Ml-Service API (daily OHLCV)
                         |                       `-> Kraken (intraday XMR/USD)
                         |-> prediction-service -> MongoDB: prediction_service.predictions
                         |                            `-> Ml-Service API (models)
                         `-> Redis: shared rate-limit counters

Optional operations profile: backup-service -> read-only PostgreSQL/MongoDB
accounts -> age-encrypted archive -> authenticated SMTP

Optional observability profile: Prometheus -> internal metrics endpoints on
the gateway and services
```

The component, data ownership, ingestion, and prediction flows are shown in
[`diagrams.md`](diagrams.md).

Services use a private Compose network. The browser enters through Nginx and
the API Gateway only; databases are not reachable through API routes. PostgreSQL
is bound to host loopback on port `5433` for DBeaver, and MongoDB to host
loopback on port `27018` for Compass. MongoDB creates distinct least-privilege
accounts for the market and prediction databases; the administrator account is
for local database management only. The Spring security service owns the
separate PostgreSQL database selected by `SECURITY_DB_NAME` (default
`aylzz_identity`); the init script creates it on fresh volumes without
overwriting an existing `USERS_DB_NAME` database.

The ML service source and Docker build context live in
`backend/services/ml-service/`. Compose retains the established `monero-api`
service DNS name and `MONERO_API_BASE_URL` setting so existing backend
adapters keep working; moving the directory does not change the service's HTTP
contract.

Nginx serves the static UI without requiring backend containers at startup;
the API Gateway hostname is resolved when a `/api/` request arrives. The
Next.js app is in `frontend/next-app/`. Its typed API adapters are an
integral frontend module, not a separately deployed microservice; their
architectural location is `frontend/services-frontend/`. In the current
checkout, the adapter directory is still at the repository root as
`services-frontend/`; its physical move is pending because Windows denies
renaming that directory. The prior HTML interface remains reachable under
`/legacy/` while the migration is validated.

The opt-in backup runner is isolated from request traffic and is documented in
[`../operations/backup-and-recovery.md`](../operations/backup-and-recovery.md).
It exports the user, market, and prediction databases; Redis and Ml-Service
volumes remain out of scope.

The opt-in Prometheus profile scrapes the Node services and Spring Actuator.
It is bound to host loopback only; its operations and audit data are documented
in [`../operations/observability.md`](../operations/observability.md).
Ml-Service remains outside the instrumentation changes.

## Gateway throttling

- General `/api/*`: 120 requests per IP per 60 seconds; 60-second block.
- `/api/auth/*`: additionally 10 requests per IP per 60 seconds; 300-second
  block.
- A rejected request returns HTTP `429`, a `Retry-After` header, and
  `too_many_requests`.
- If Redis is unavailable, the gateway returns HTTP `503` rather than bypassing
  throttling.
- No automatic upstream retries: market refresh and prediction POSTs can have
  side effects or trigger expensive training.

The limits are initial local defaults and should be tuned with production
traffic metrics. Service health/readiness endpoints check required dependencies.

## Time-series granularity

The Ml-Service data contract provides daily OHLCV with calendar dates. The
market-service keeps that daily history separate from Kraken spot candles:
5-minute data covers the last 12 hours and 1-minute data covers the last
10 minutes. Intraday candle timestamps are UTC, the in-progress candle is
excluded, and the frontend formats them in the browser's local time zone.
Provider errors are shown without substituting daily data.

## Local configuration

Copy `.env.example` to `.env` and set unique random values for each database
password, the JWT signing secret, and Redis password. `.env` is ignored by Git.
MongoDB's initialization script creates its service accounts only when the
database volume is first initialized; credential rotations need an explicit
database-user update.
