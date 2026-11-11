# Market service

This Node.js/TypeScript service adapts the existing Ml-Service API and owns
`market_service` in MongoDB. `GET /api/v1/market` and
`POST /api/v1/market/refresh` synchronize returned OHLCV rows into the
`candles` collection (unique `symbol` + `date` index) and serve the stored
rows using the existing API response contract.

The current source has daily dates only. This service does not manufacture
minute candles; intraday intervals require a verified source and timestamps.
`GET /health` checks the process and `GET /ready` checks MongoDB.

The Compose-created MongoDB account `market_service` has `readWrite` access
only to its own database. For local administration, use MongoDB Compass at
`127.0.0.1:27018` with the root credentials from the ignored `.env`.
