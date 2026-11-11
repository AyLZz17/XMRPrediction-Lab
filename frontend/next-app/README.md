# Next.js frontend

The Next.js 16 app uses React, TypeScript, and ECharts. Its static export is
served by the existing Nginx container; `/api/*` remains a same-origin route
through the API Gateway.

```powershell
Set-Location frontend\next-app
npm ci
npm run dev
```

The typed API adapters are an integral part of `frontend/`, not a separately
deployed service. Their architectural location is
`frontend/services-frontend/`; in the current checkout, the directory remains
at the repository root pending resolution of a Windows permission that blocks
its move. The Docker build context is the repository root so the app can share
those adapters and reuse the established stylesheet at `frontend/css/style.css`.

The former HTML/JavaScript pages remain available under `/legacy/pages/` while
the React routes are validated. Login and registration use the Spring identity
API and its HttpOnly cookie; no credential or session token is stored in
browser storage. Language, text-size, and contrast preferences are stored
locally. Market timestamps use the browser's local time zone; daily candle
dates retain their provider calendar date.
