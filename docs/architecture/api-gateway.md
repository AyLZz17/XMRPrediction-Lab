# API Gateway foundation

Browser API traffic enters through Nginx, which forwards `/api/*` to the
internal TypeScript gateway. The gateway routes requests to the owning
microservice:

```text
Browser -> Nginx frontend -> Node.js/TypeScript API Gateway
                               |-> /api/auth/* -> Spring Boot -> PostgreSQL
                               |-> /api/v1/market/* -> market-service -> MongoDB
                               |                                  |-> Monero daily data
                               |                                  `-> Kraken intraday
                               |-> /api/v1/predictions/* -> prediction-service -> MongoDB
                               `-> other /api/* -> Ml-Service API (existing)
```

The gateway exposes `GET /health` for process health and `GET /ready` for
dependency health checks, including Redis. It preserves upstream HTTP status
codes, bodies, and authentication cookies. A gateway-to-upstream connection
failure is returned as `502 upstream_unavailable`.

The shared API limit is 120 requests per IP per minute. Authentication routes
additionally allow 10 requests per IP per minute and apply a five-minute block.
Redis failures are fail-closed with HTTP 503; rejected requests return HTTP 429
and `Retry-After`.

Automatic retries are intentionally not enabled: retrying a `POST` can repeat
side effects or expensive model training. The gateway proxy timeout is bounded
at one hour for existing model-refresh behavior. Intraday requests use the same
market route and are validated, cached, and persisted by `market-service`.

## Local checks

```powershell
Set-Location backend\services\shared-observability
npm ci
Set-Location ..\api-gateway
npm ci
npm test
```

From the repository root, validate Compose with
`docker compose --env-file .env.example config --quiet`.
