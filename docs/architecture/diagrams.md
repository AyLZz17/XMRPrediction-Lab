# Architecture diagrams

The diagrams describe the deployed local Compose topology. The optional backup
and Prometheus profiles are shown separately from request traffic.

## Service architecture and data ownership

```mermaid
flowchart LR
    browser["Researcher browser"]
    frontend["Nginx serving static Next.js"]
    gateway["API Gateway<br/>Node.js + TypeScript"]
    redis["Redis<br/>rate limits and temporary state"]
    security["Security service<br/>Spring Boot"]
    postgres["PostgreSQL<br/>users and auth audit"]
    market["Market service<br/>Node.js + TypeScript"]
    marketMongo["MongoDB<br/>market_service"]
    mlService["Ml-Service API<br/>existing daily data and models"]
    kraken["Kraken public OHLC<br/>XMR/USD spot"]
    predictions["Prediction service<br/>Node.js + TypeScript"]
    predictionMongo["MongoDB<br/>prediction_service"]
    backup["Backup service<br/>optional profile"]
    smtp["Authenticated SMTP"]
    prometheus["Prometheus<br/>optional profile"]

    browser --> frontend
    frontend -->|"/api/*"| gateway
    gateway -->|"shared request limits"| redis
    gateway -->|"/api/auth/*"| security
    security --> postgres
    gateway -->|"/api/v1/market/*"| market
    market --> marketMongo
    market -->|"daily OHLCV"| mlService
    market -->|"1m and 5m candles"| kraken
    gateway -->|"/api/v1/predictions/*"| predictions
    predictions --> predictionMongo
    predictions -->|"prediction request"| mlService
    gateway -->|"other /api/* routes"| mlService
    backup -->|"read-only dumps"| postgres
    backup -->|"read-only dumps"| marketMongo
    backup -->|"read-only dumps"| predictionMongo
    backup -->|"age-encrypted archive"| smtp
    prometheus -.->|"scrapes private metrics"| gateway
    prometheus -.->|"scrapes private metrics"| market
    prometheus -.->|"scrapes private metrics"| predictions
    prometheus -.->|"scrapes private metrics"| security
```

## Data model and ownership

PostgreSQL is owned by the security service. Each MongoDB database is restricted
to its owning service; the gateway and other services do not query these
databases directly.

```mermaid
erDiagram
    USERS o|--o{ AUTH_AUDIT_EVENTS : "has audit events"

    USERS {
        UUID id PK
        string email UK
        string password_hash
        datetime created_at
    }

    AUTH_AUDIT_EVENTS {
        bigint id PK
        string event_type
        UUID user_id FK
        string request_id
        datetime occurred_at
    }

    DAILY_CANDLE {
        string symbol PK
        string date PK
        float open
        float high
        float low
        float close
        float volume
        datetime ingested_at
    }

    INTRADAY_CANDLE {
        string symbol PK
        string interval PK
        datetime timestamp PK
        float open
        float high
        float low
        float close
        float volume
        datetime ingested_at
    }

    PREDICTION {
        string _id PK
        json request
        json response
        datetime recorded_at
    }
```

The market collection keys correspond to the unique MongoDB indexes:
`(symbol, date)` for daily candles and `(symbol, interval, timestamp)` for
intraday candles. Intraday documents expire 24 hours after their last
ingestion. Prediction request/response payloads are validated service
contracts, not relational tables.

## Market data ingestion

```mermaid
flowchart TD
    daily["Ml-Service API daily OHLCV"]
    kraken["Kraken OHLC API"]
    dailyAdapter["Daily Monero adapter"]
    intradayAdapter["Kraken intraday adapter"]
    validateDaily["Validate daily OHLCV"]
    validateIntraday["Validate UTC timestamps and OHLCV"]
    dailyStore["Upsert daily candles"]
    window["Select 1m / 10m or 5m / 12h window"]
    closed["Exclude the in-progress candle"]
    intradayStore["Upsert completed UTC candles"]
    gateway["API Gateway"]
    ui["Next.js chart<br/>local-time formatting"]

    daily --> dailyAdapter
    dailyAdapter --> validateDaily
    validateDaily --> dailyStore
    dailyStore --> gateway
    kraken --> intradayAdapter
    intradayAdapter --> validateIntraday
    validateIntraday --> window
    window --> closed
    closed --> intradayStore
    intradayStore --> gateway
    gateway --> ui
```

Daily and intraday data remain separate. Provider failure is reported; the
service does not resample daily values or silently fall back to another source.

## Prediction request

```mermaid
sequenceDiagram
    actor Researcher
    participant UI as "Next.js dashboard"
    participant Gateway as "API Gateway"
    participant Redis
    participant Prediction as "Prediction service"
    participant Monero as "Ml-Service API"
    participant Mongo as "prediction_service MongoDB"

    Researcher->>UI: Select model and request prediction
    UI->>Gateway: POST /api/v1/predictions
    Gateway->>Redis: Consume shared API limit
    alt Limit exceeded
        Redis-->>Gateway: Reject request
        Gateway-->>UI: 429 with Retry-After
    else Request allowed
        Redis-->>Gateway: Allow request
        Gateway->>Prediction: Forward validated request
        Prediction->>Monero: POST /api/v1/predictions
        Monero-->>Prediction: Prediction and market response
        Prediction->>Mongo: Persist validated response
        Mongo-->>Prediction: Acknowledge write
        Prediction-->>Gateway: HTTP 200 result
        Gateway-->>UI: Preserve upstream response
    end
```

The gateway and services do not retry prediction POSTs automatically. The
prediction service owns its MongoDB writes and does not access the market
service database.
