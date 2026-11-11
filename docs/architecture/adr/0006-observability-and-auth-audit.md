# ADR 0006: Internal metrics, structured logs, and authentication audit

- Status: Accepted
- Date: 2026-11-11

## Context

The service health/readiness endpoints were present, but request logs were
unstructured, services had no scrapeable HTTP metrics, and authentication
events were not persisted. The observability baseline must remain internal to
the Compose network and must not expose credentials or request bodies.

## Decision

- Add a shared Node package that emits JSON request logs, validates or creates
  `X-Request-ID` values, and exports bounded-route Prometheus HTTP/process
  metrics for the gateway, market service, and prediction service.
- Enable Spring Boot structured console logging and Actuator Prometheus metrics
  for the security service.
- Persist authentication registration, login, and logout outcomes in an
  append-only-by-application audit table. Do not store submitted emails,
  passwords, tokens, request bodies, or source IPs.
- Add an opt-in Prometheus Compose profile. Bind its UI to host loopback and
  keep service metrics endpoints private to the Compose network.
- Leave `Monero/` unchanged. Defer alert rules, dashboards, and external log
  aggregation to a deployment-specific phase.

## Consequences

- Request IDs correlate gateway and service logs without logging query strings
  or bodies.
- Prometheus retains a bounded 15-day local metrics history; the storage volume
  is separate from application data.
- Audit events are preserved by the PostgreSQL backup workflow. Operators
  must define the appropriate retention/privacy policy for deployment.
- The Prometheus UI has no authentication and is therefore bound to
  `127.0.0.1`; it must not be exposed directly to an untrusted network.
- The audit table is application-level evidence, not tamper-proof storage
  against a database owner.
