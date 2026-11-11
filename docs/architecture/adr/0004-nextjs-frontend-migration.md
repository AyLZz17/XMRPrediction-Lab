# ADR 0004: Incremental Next.js frontend migration

- Status: Accepted
- Date: 2026-11-10

## Context

The existing UI provides the visual and functional reference. Replacing it
before the React implementation is validated would risk losing dashboard,
chart, and research behavior.

## Decision

- Build a Next.js 16 / React / TypeScript app in `frontend/next-app/` to
  coexist with the original `frontend/pages/` HTML files.
- Use a static export served by the current Nginx container. Nginx remains the
  same-origin entry point and forwards `/api/*` to the API Gateway.
- Keep the prior HTML, CSS, JavaScript, and assets accessible under `/legacy/`
  until route-by-route equivalence is validated.
- Keep typed, runtime-validated browser API adapters as an integral frontend
  module in `frontend/services-frontend/`, not as an independently deployed
  service. The current checkout still has the directory at the repository root;
  its move is pending resolution of a Windows directory permission.
- Authenticate only through the Spring identity endpoints and HttpOnly cookie;
  never keep credentials or session tokens in local storage.
- Provide Spanish/English UI, keyboard-visible focus, text-size and contrast
  controls, and local-time formatting for actual timestamps.
- Display verified daily market data only; intraday intervals require a source
  with verified minute-level timestamps.

## Consequences

- Next static output is deployed by Nginx without exposing internal service
  addresses or adding a second frontend runtime.
- The legacy implementation is retained for comparison and rollback.
- The app build context is the repository root so it can share frontend
  modules and legacy assets without copying adapter logic.
- Existing layout styles are reused; the migrated dashboard keeps the
  navigation, OHLCV chart, prediction, benchmark, methodology, and disclaimer
  surfaces.
