# API Gateway foundation

The public browser traffic still enters through the existing Nginx frontend.
Nginx forwards `/api/*` to the internal TypeScript gateway, which currently
routes API requests to the unchanged `Monero/` service:

```text
Browser -> Nginx frontend -> Node.js/TypeScript API Gateway -> Monero API
```

The gateway exposes `GET /health` for process health and `GET /ready` for
dependency readiness. It preserves upstream HTTP status codes and bodies; a
gateway-to-upstream connection failure is returned as `502
upstream_unavailable`. The upstream timeout remains bounded at one hour to
preserve the existing long-running model-refresh/prediction behavior.

Automatic retries are intentionally not enabled: retrying a `POST` can repeat
side effects. Redis-backed rate limiting, authenticated service-to-service
contracts, identity, and routing to new services belong to later migration
phases. Intraday chart intervals must wait for a provider with verified
timestamped intraday coverage.

## Local checks

```powershell
cd backend/services/api-gateway
npm ci
npm test
```

From the repository root, validate Compose with `docker compose config --quiet`.
