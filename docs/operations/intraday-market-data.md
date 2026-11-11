# Intraday market data

The market service exposes verified Kraken spot candles through the API
gateway:

```text
GET /api/v1/market/intraday?interval=5m
GET /api/v1/market/intraday?interval=1m
```

`5m` returns completed candles in the preceding 12 hours. `1m` returns
completed candles in the preceding 10 minutes. Timestamps are ISO 8601 UTC
values. The frontend formats them in the browser's local time zone and labels
the data source as Kraken XMR/USD spot-market data.

The adapter requests Kraken's public OHLC endpoint with pair `XMRUSD` and the
selected interval. It validates finite OHLCV values, positive prices,
non-negative volume, and high/low consistency. The current unfinished candle
is excluded; daily Monero candles are never resampled or used as a fallback.
The market service stores intraday rows in its own `market_service` MongoDB
database, in `intraday_candles`, with a unique `(symbol, interval, timestamp)`
index. A TTL index expires candles 24 hours after their last ingestion. The
service coalesces concurrent provider requests and caches each interval for
15 seconds.

Provider failures return HTTP 503 with `intraday_provider_unavailable`;
MongoDB failures return HTTP 503. Invalid intervals return HTTP 400. A
provider-supplied retry delay is returned as `Retry-After` when available.
Kraken's public endpoint is an external dependency without an application
fallback: if it is unavailable, the UI shows an error instead of fabricating
or silently substituting data.

Validate the adapter and endpoint from the repository root with:

```powershell
Set-Location backend\services\market-service
npm test
```

The endpoint requires outbound HTTPS access from `market-service`. It does not
require an API key.

See the [Kraken OHLC endpoint documentation](https://docs.kraken.com/api/docs/rest-api/get-ohlc-data/).
