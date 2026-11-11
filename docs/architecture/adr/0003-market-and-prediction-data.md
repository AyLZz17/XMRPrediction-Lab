# ADR 0003: Separate MongoDB ownership for market and prediction data

- Status: Accepted
- Date: 2026-11-10

## Context

The architecture assigns market time series and prediction history to
MongoDB while keeping the existing Monero implementation out of the rewrite.
Microservices must not access another service's database directly.

## Decision

- `market-service` owns the `market_service` database and `candles` collection.
  Its database account is restricted to that database. Upserts use a unique
  `(symbol, date)` index.
- `market-service` also owns the `intraday_candles` collection with a unique
  `(symbol, interval, timestamp)` index. A Kraken adapter supplies validated
  1-minute/5-minute XMR/USD spot candles; only completed UTC candles are stored.
- `prediction-service` owns the separate `prediction_service` database and
  stores the validated Monero prediction response with its request parameters
  and UTC recording time.
- Both services call the existing Monero API through HTTP adapters and preserve
  the established browser API contract. `Monero/` remains unchanged.
- Redis stores gateway request counters. A shared limit is 120 requests/minute;
  authentication routes also have a 10 requests/minute limit and a five-minute
  block. Redis failure is fail-closed (HTTP 503).
- Retry is not automatic for POST operations because refresh and prediction
  calls can cause side effects or expensive model training.

## Consequences

- Market OHLCV and prediction history persist in separate MongoDB databases.
- Daily market data is not transformed into fabricated intraday candles.
  Intraday UI windows are sourced from Kraken and clearly labeled; provider
  failures are shown rather than replaced with daily data.
- Local Compass access uses the MongoDB administrator credentials from the
  ignored `.env`; services use separate restricted accounts.
- Rate limits are configurable in code and need production traffic tuning.

## Validation

Market and prediction service contract tests pass. A Docker-backed check
synchronized live daily Monero candles into `market_service` and verified the
documents there. Gateway tests cover service routing, 429/`Retry-After`,
dependency readiness, and Redis fail-closed behavior.

Intraday provider and persistence behavior is tested with a mocked Kraken
response; no external request is needed to run the test suite.
