# Testing & QA Enterprise

## Descripción
Habilidad para la implementación de estrategias de testing integrales y aseguramiento de calidad en aplicaciones empresariales.

## Niveles de testing

### Unit Testing
- **Herramientas**: Jest, Vitest, Mocha, JUnit, pytest, xUnit
- **Cobertura**: Mínimo 80%, objetivo 90%
- **Principios**: AAA (Arrange, Act, Assert)
- **Mocking**: Sinon, Moq, unittest.mock
- **TDD**: Red-Green-Refactor

### Integration Testing
- Test de APIs (Supertest, REST Assured)
- Test de bases de datos (Testcontainers)
- Test de servicios externos (WireMock, Mountebank)
- Contract testing (Pact)

### End-to-End Testing
- **Cypress**: Component testing, E2E, visual testing
- **Playwright**: Cross-browser, mobile, API testing
- **Selenium**: Legacy, multi-browser
- **Appium**: Mobile testing

### Performance Testing
- **k6**: Load testing, stress testing
- **JMeter**: Protocol-level testing
- **Gatling**: Scala-based, high performance
- **Locust**: Python-based, distributed
- **Artillery**: Serverless, easy to use

### Security Testing
- **SAST**: SonarQube, Checkmarx, Semgrep
- **DAST**: OWASP ZAP, Burp Suite
- **Dependency scanning**: Snyk, Dependabot, Trivy
- **Penetration testing**: Metasploit, Nmap

### Accessibility Testing
- axe-core, Lighthouse, WAVE
- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard navigation testing
- Color contrast analysis

## Estrategia de testing
- Pirámide de testing (unidades > integración > E2E)
- Testing trophy (integración > unit > E2E > static)
- Feature flags para testing en producción
- Canary releases y A/B testing
- Chaos engineering (Gremlin, Chaos Monkey)

## Automatización
- Pipelines de CI/CD con gates de calidad
- Parallel execution
- Test data management
- Reportes y dashboards
- Flaky test detection y manejo

## Métricas de calidad
- Code coverage
- Defect density
- Mean time to detection (MTTD)
- Mean time to resolution (MTTR)
- Test execution time
- Pass/fail rate
