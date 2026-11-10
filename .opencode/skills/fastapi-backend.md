# S-09 · Backend API (FastAPI)

## Cuándo usarla
Al diseñar e implementar la API REST del sistema de predicción.

## Herramientas
- **FastAPI**: Framework web asíncrono
- **Pydantic**: Validación de datos
- **SQLAlchemy**: ORM
- **Uvicorn**: Servidor ASGI

## Receta

### Estructura de routers
- **auth**: Autenticación y autorización
- **market**: Datos de mercado
- **experiments**: Gestión de experimentos
- **predictions**: Predicciones del modelo

### Esquemas Pydantic
- Entrada y salida tipados
- Validación automática
- Documentación OpenAPI automática

### Dependencias
- Sesión de base de datos
- Usuario actual (autenticación)

### Respuestas
- `202 Accepted` para trabajos largos (entrenamiento, ingesta)
- Paginación en listados
- Errores con formato uniforme
- OpenAPI incluye el aviso legal

### Formato de error uniforme
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripción del error",
    "details": {}
  }
}
```

## Errores típicos
- ❌ Cargar el modelo Keras en cada petición (usar carga perezosa con caché)
- ❌ Lógica de negocio dentro del router (separar en servicios)
- ❌ No usar Pydantic para validación
- ❌ No manejar errores de forma uniforme
- ❌ Exponer endpoints sin autenticación

## Checklist
- [ ] Routers organizados por dominio
- [ ] Esquemas Pydantic definidos
- [ ] Dependencias de BD y auth configuradas
- [ ] Respuestas 202 para trabajos largos
- [ ] Paginación en listados
- [ ] Formato de error uniforme
- [ ] Aviso legal en OpenAPI
