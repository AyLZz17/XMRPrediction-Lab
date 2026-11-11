# MEMORY.md -- Memoria de corto plazo (max. 50 lineas)
> Reescribir tras cada tarea; lo permanente va en AGENTS.md.

## Contexto actual
- AyLZz Crypto Lab explora OHLCV diario de XMR y predicciones experimentales; no es asesoría financiera.
- `backend/services/ml-service/` conserva su contrato, código, datos y tareas existentes.
- Stack Docker completo levantado; frontend verificado en `http://127.0.0.1:8081/`.
- Spring usa `aylzz_identity` (`SECURITY_DB_NAME`); la base heredada `aylzz_users` se conserva intacta.
- `.env` se mantiene privado; no detener ni eliminar servicios/volúmenes ajenos a la validación.

## Arquitectura y avance
- Objetivo: Next.js/adaptadores integrados en frontend, gateway Node/TS, auth Spring/PostgreSQL, MongoDB por servicio y Redis.
- Adaptadores siguen en raíz: ACL de Windows bloquea moverlos; no duplicar ni cambiar permisos sin autorización.
- Fases 1–3 completadas: commits `a26c2f5`, `0b8e66f`, `9975b85` (gateway, auth, mercado/predicción).
- Fase 4 completada, `0e88b5f`: Next.js, preferencias, dashboard y compatibilidad heredada en `/legacy/`.
- Fase 5 completada, `c9351ae`: backups opt-in PostgreSQL/Mongo, solo lectura, cifrado age y SMTP STARTTLS.
- SMTP/restauración real pendiente: faltan destinatario y credenciales designados; clave privada age externa.
- Fase 6 completada, `68511c3`: logs JSON/request ID, métricas Prometheus y auditoría sin datos sensibles.
- Fase 6 verificada: 16 Node, 3 Java, imágenes, Prometheus y auditoría; Testcontainers omitió 5 pruebas sin Docker.
- Next.js vive en `frontend/next-app/`; mercado y predicciones son dueños de bases Mongo separadas.
- Fase 7 completada, `0349055`: Kraken XMR/USD, 5m/12h y 1m/10m, velas cerradas y retención TTL 24h.
- Fase 7 verificada: market (10), gateway (9), Next typecheck/build y respuestas reales Kraken.
- Fase 8 docs/CI completada, `3d3ceb9`; Mermaid, guía operativa y workflow actualizados.
- Verificado fase 8: gateway (9), backup (3), Compose y 4 diagramas; pytest/Maven local pendientes.
- Redis no disponible: gateway falla cerrado; no reintentar POST con efectos secundarios automáticamente.
- Fase 4 también verificada en navegador para auth, mercado, predicción, idioma y accesibilidad.
- El gráfico no expone valores NaN antes ni después de una predicción.
- No incluir cambios previos del usuario en commits; validar sin interrumpir servicios existentes.

## Pendiente
- Probar SMTP/restauración cuando se designen destinatario, credenciales y clave age.
- La base heredada `aylzz_users` tenía un esquema incompatible; no activar baseline ni migrarla a ciegas.
