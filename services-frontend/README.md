# Frontend service adapters

These TypeScript modules are the browser's only API entry point. They call
same-origin `/api/*` routes, validate JSON before exposing typed data, and
leave routing and authorization to the API Gateway and backend services.

- `auth.ts`: sign-in, registration, current session, and sign-out. Authentication
  tokens are never read from or stored in browser storage.
- `market.ts`: market reads/refresh and daily OHLCV validation.
- `predictions.ts`: benchmark and prediction contracts.
- `http.ts`: shared JSON transport and typed API errors.

The Next.js app imports these modules through its monorepo TypeScript alias.
