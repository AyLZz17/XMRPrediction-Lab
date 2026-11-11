# Continuous integration

The GitHub Actions workflow at `.github/workflows/ci.yml` checks the current
repository architecture rather than the retired `ml-service` layout. It runs:

- Gitleaks and a check that `.env` is not tracked.
- Node tests and production dependency audits for the gateway, market, and
  prediction services; TypeScript checks/build and dependency audit for Next.js.
- Java 21 verification and Spring/Testcontainers integration tests.
- Monero API/model tests and encrypted-backup unit tests.
- Mermaid rendering, Docker Compose configuration validation, and image builds
  for the complete stack and optional backup profile.
- A Trivy filesystem scan for high and critical vulnerabilities and
  misconfiguration.

No job deploys to an environment or sends a real backup email. Deployment,
SMTP credentials, the age private key, and the recipient remain environment
specific and must not be added to repository secrets until an operator
designates them.

## Local checks

Run the smaller checks from PowerShell:

```powershell
Set-Location backend\services\shared-observability
npm ci
Set-Location ..\api-gateway
npm ci
npm test
```

Repeat `npm ci` and `npm test` in `market-service` and `prediction-service`.
Run frontend checks from `frontend\next-app`:

```powershell
npm ci
npm run typecheck
npm run build
```

Run the Java tests from `backend\services\security-service` with
`mvn -B verify`; Docker is required for the Testcontainers integration tests.
Run the backup tests from the repository root with
`python -m unittest discover -s infra\backup -p "test_*.py"`.

For diagrams, `python tools\validate_mermaid.py docs\architecture\diagrams.md`
uses the pinned Mermaid CLI version in the validator. Compose configuration
uses `.env.example` only for interpolation:

```powershell
docker compose --env-file .env.example config --quiet
```

The example values are placeholders and are not suitable for running the
services. Do not copy them into a deployed environment.
