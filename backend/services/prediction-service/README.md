# Prediction service

This Node.js/TypeScript service forwards the established prediction contract
to the unchanged Monero model API and owns prediction history in the separate
MongoDB database `prediction_service`. Successful results are recorded with
the request parameters and UTC recording time before they are returned.

- `POST /api/v1/predictions`: validate, forward, persist, and return a
  prediction.
- `GET /api/v1/predictions/history?limit=100`: read recent persisted results.
- `GET /health` and `GET /ready`: process and MongoDB checks.

The `prediction_service` MongoDB account can only write its own database.
Other services do not read this database directly; use the API Gateway.
