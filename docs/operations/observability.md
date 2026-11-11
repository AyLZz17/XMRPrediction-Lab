# Observability and audit

## Start the local metrics collector

Start the optional profile without changing the normal application profile:

```powershell
docker compose --profile observability up -d prometheus
```

Open `http://127.0.0.1:9090`. Prometheus retains 15 days of scraped metrics in
the `prometheus-data` volume. The host port is loopback-only, and service
metrics endpoints are reachable only on the private Compose network.

The gateway, market, and prediction services expose `/metrics`. They report
HTTP request totals, request-duration histograms, and Node.js process/runtime
metrics. The security service exposes Spring Actuator at
`/actuator/prometheus` with HTTP and JVM metrics. The scrape interval is 15
seconds.

For local Node.js tests, install the shared package before installing or testing
each service:

```powershell
Set-Location backend/services/shared-observability
npm ci
Set-Location ../api-gateway
npm ci
npm test
```

Repeat the service install/test commands from `market-service` and
`prediction-service`. Docker builds perform both installs automatically.

Example PromQL queries:

```promql
sum by (service, route, status_code) (rate(http_requests_total[5m]))
```

```promql
histogram_quantile(
  0.95,
  sum by (le, service) (rate(http_request_duration_seconds_bucket[5m]))
)
```

## Logs and request correlation

Node services write JSON log records to container stdout/stderr. Spring Boot
uses structured Logstash JSON console output. HTTP completion records include
service, method, normalized route, status, duration, and `request_id`; query
strings and request bodies are not logged. A valid incoming `X-Request-ID` is
propagated; invalid or missing values are replaced with a generated ID.

Inspect logs with:

```powershell
docker compose logs --follow api-gateway market-service prediction-service security-service
```

## Authentication audit

Spring Flyway migration `V2` creates `auth_audit_events`. The service records
registration success/rejection, login success/failure, and authenticated
logout with UTC timestamps, optional user IDs, and request IDs. Failed
credentials do not persist the submitted email. Passwords, tokens, request
bodies, and source IPs are not stored in the audit table.

The application exposes no audit-query endpoint. Authorized operators can
inspect the table through PostgreSQL/DBeaver; restrict database access and
include this table in the normal encrypted database backups. Audit retention is
currently indefinite and should be governed by the deployment's retention and
privacy policy.

Monero remains unchanged and is not instrumented by this phase. Prometheus
alert rules, Grafana dashboards, and external log aggregation are not included
in this local baseline.
