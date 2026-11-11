# API Gateway foundation

The public browser traffic still enters through the existing Nginx frontend.
Nginx forwards `/api/*` to the internal TypeScript gateway, which routes
authentication requests to Spring Boot and existing market/model requests to
the unchanged `Monero/` service:

```text
Browser -> Nginx frontend -> Node.js/TypeScript API Gateway
                               |-> Spring Boot Security Service -> PostgreSQL
                               `-> Monero API (existing)
```

The gateway exposes `GET /health` for process health and `GET /ready` for both
dependency health checks. `/api/auth/*` routes to the security service; other
`/api/*` routes continue to the Monero API. It preserves upstream HTTP status
codes, bodies, and authentication cookies. A gateway-to-upstream connection
failure is returned as `502 upstream_unavailable`. The upstream timeout remains
bounded at one hour to preserve existing long-running model-refresh behavior.

Automatic retries are intentionally not enabled: retrying a `POST` can repeat
side effects. Redis-backed rate limiting and authenticated service-to-service
contracts remain later migration phases. Intraday chart intervals must wait
for a provider with verified timestamped intraday coverage.

## Local checks

```powershell
cd backend/services/api-gateway
npm ci
npm test
```

From the repository root, validate Compose with `docker compose config --quiet`.
