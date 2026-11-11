# Frontend API adapters

These TypeScript modules are an integral part of the frontend, not an
independently deployed service. They are the browser's only API entry point:
they call same-origin `/api/*` routes, validate JSON before exposing typed
data, and leave routing and authorization to the API Gateway and backend
services. Their architectural location is `frontend/services-frontend/`; this
checkout still stores them at the repository root pending resolution of a
Windows permission that blocks the move.

- `auth.ts`: sign-in, registration, current session, and sign-out. Authentication
  tokens are never read from or stored in browser storage.
- `market.ts`: market reads/refresh and daily OHLCV validation.
- `predictions.ts`: benchmark and prediction contracts.
- `http.ts`: shared JSON transport and typed API errors.

The Next.js app imports these modules through its monorepo TypeScript alias.
