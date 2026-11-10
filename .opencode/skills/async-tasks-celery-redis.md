# S-11 · Tareas asíncronas (Celery/Redis)

## Cuándo usarla
Al implementar tareas de larga duración: ingesta de datos, entrenamiento de modelos, etc.

## Herramientas
- **Celery**: Cola de tareas distribuida
- **Redis**: Broker de mensajes y backend de resultados
- **Celery Beat**: Programador de tareas periódicas

## Receta

### Tareas principales
- `ingest_daily`: Ingesta diaria de datos OHLCV
- `run_experiment`: Ejecución de experimento de ML

### Características
- **Idempotencia**: Las tareas deben ser idempotentes
- **Estado**: Registrar en `training_run.status`
- **Reintentos**: Con *backoff* exponencial en ingesta
- **Worker**: Reutiliza el mismo paquete `ml/`

### Configuración
```python
# celeryconfig.py
broker_url = "redis://localhost:6379/0"
result_backend = "redis://localhost:6379/0"
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]
timezone = "UTC"
enable_utc = True

# Reintentos con backoff
task_default_retry_delay = 60  # 1 minuto
task_max_retries = 3
```

### Ejemplo de tarea
```python
from celery import shared_task

@shared_task(bind=True, max_retries=3)
def ingest_daily(self, asset_id: str):
    try:
        # Lógica de ingesta
        pass
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

## Errores típicos
- ❌ Tareas no idempotentes (datos duplicados al reintentar)
- ❌ No manejar reintentos con backoff
- ❌ No registrar estado de la tarea
- ❌ Usar el worker para tareas que no son asíncronas
- ❌ No configurar Celery Beat para tareas periódicas

## Checklist
- [ ] Celery configurado con Redis
- [ ] Tareas idempotentes
- [ ] Reintentos con backoff exponencial
- [ ] Estado de tareas registrado en BD
- [ ] Celery Beat para tareas periódicas
- [ ] Worker reutiliza paquete ml/
