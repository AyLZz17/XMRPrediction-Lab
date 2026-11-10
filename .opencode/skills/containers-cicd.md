# S-13 · Contenedores y CI/CD

## Cuándo usarla
Al configurar el entorno de desarrollo, testing y despliegue del sistema.

## Herramientas
- **Docker**: Contenedores
- **Docker Compose**: Orquestación local
- **GitHub Actions**: CI/CD

## Receta

### Servicios Docker Compose
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: xmr_forecast
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    depends_on: [db, redis]
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/xmr_forecast
      REDIS_URL: redis://redis:6379/0

  worker:
    build: ./backend
    command: celery -A app worker
    depends_on: [db, redis]

  beat:
    build: ./backend
    command: celery -A app beat
    depends_on: [db, redis]

  mlflow:
    image: mlflow/mlflow
    ports:
      - "5000:5000"

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
```

### Pipeline CI/CD
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
    steps:
      - uses: actions/checkout@v4
      - name: Lint
        run: ruff check .
      - name: Type check
        run: mypy .
      - name: Unit tests
        run: pytest --cov=ml tests/unit
      - name: Integration tests
        run: pytest tests/integration
      - name: Build
        run: docker compose build
```

### Imágenes
- Dependencias fijadas (requirements.txt con versiones)
- Multi-stage builds para reducir tamaño
- Usuario no root en producción

## Errores típicos
- ❌ Dependencias no fijadas en requirements.txt
- ❌ No usar multi-stage builds
- ❌ Ejecutar como root en producción
- ❌ No configurar health checks
- ❌ No usar servicios en CI para tests de integración

## Checklist
- [ ] Docker Compose con todos los servicios
- [ ] CI: lint → tipos → tests unitarios → integración → build
- [ ] Dependencias fijadas
- [ ] Multi-stage builds
- [ ] Usuario no root en producción
- [ ] Health checks configurados
