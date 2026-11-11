# Backend services and data ownership

```text
Browser -> Nginx (Next.js static export) -> Node.js/TypeScript API Gateway
                       |-> Spring Boot security -> PostgreSQL: users + auth_audit_events
                       |-> market-service -> MongoDB: market_service.candles
                       |                       `-> Monero API (daily OHLCV)
                       |-> prediction-service -> MongoDB: prediction_service.predictions
                       |                            `-> Monero API (models)
                       `-> Redis: shared rate-limit counters

Optional operations profile: backup-service -> read-only PostgreSQL/MongoDB
accounts -> age-encrypted archive -> authenticated SMTP

Optional observability profile: Prometheus -> internal metrics endpoints on
the gateway and services
```

Services use a private Compose network. The browser enters through Nginx and
the API Gateway only; databases are not reachable through API routes. PostgreSQL
is bound to host loopback on port `5433` for DBeaver, and MongoDB to host
loopback on port `27018` for Compass. MongoDB creates distinct least-privilege
accounts for the market and prediction databases; the administrator account is
for local database management only.

The Next.js app and its typed API adapters are in `frontend/next-app/` and
`services-frontend/`. The prior HTML interface remains reachable under
`/legacy/` while the migration is validated.

The opt-in backup runner is isolated from request traffic and is documented in
[`../operations/backup-and-recovery.md`](../operations/backup-and-recovery.md).
It exports the user, market, and prediction databases; Redis and Monero
volumes remain out of scope.

The opt-in Prometheus profile scrapes the Node services and Spring Actuator.
It is bound to host loopback only; its operations and audit data are documented
in [`../operations/observability.md`](../operations/observability.md).
Monero remains outside the instrumentation changes.

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

The current Monero data contract provides daily OHLCV with calendar dates, not
timestamped intraday trades/candles. The market service stores that verified
daily data only. Five-minute and one-minute intervals remain unavailable until
a market data source with those intervals and reliable timestamps is selected.

## Local configuration

Copy `.env.example` to `.env` and set unique random values for each database
password, the JWT signing secret, and Redis password. `.env` is ignored by Git.
MongoDB's initialization script creates its service accounts only when the
database volume is first initialized; credential rotations need an explicit
database-user update.
