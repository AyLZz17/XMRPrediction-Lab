# MEMORY.md -- Memoria de corto plazo (max. 50 lineas)
> Reescribir tras cada tarea; lo permanente va en AGENTS.md.

## Contexto actual
- AyLZz Crypto Lab es un portal preliminar para análisis diario de Monero
  (XMR-USD); la arquitectura objetivo ya está acordada y su migración pendiente.
- Docker Compose integra frontend Nginx y API FastAPI en `Monero/src/api.py`.
- Datos Yahoo Finance -> `Monero/data/raw/xmr_usd_diario.csv` -> preparación
  del dataset -> predicción de cierre del siguiente día.
- La UI consume velas OHLCV reales, benchmark de métricas y resultados del API.
- Persistencia/media móvil no entrenan; ARIMA/LSTM/GRU entrenan al detectar un
  dataset nuevo. Volúmenes Docker conservan datos, modelos y resultados.
- Acceso local de demostración solamente; no es asesoría financiera.

## Verificado en esta tarea
- Compose incluye `monero-scheduler`: descarga/prepara OHLCV cada día a 03:15
  UTC; reentrena 9 ejecuciones de modelos y regenera el benchmark cada domingo
  a 04:00 UTC. API informa próxima ejecución y marcas de CSV/NPZ/benchmark.
- Scheduler activo en Azure; endpoint `/api/v1/maintenance` responde por la IP
  pública. Suite Monero: 21 pruebas aprobadas.
- `POST /api/v1/predictions` lee el dataset persistido y no refresca el mercado;
  el frontend conserva intacta la cotización real al mostrar el pronóstico.
- En 2026-11-10, CSV/NPZ contenían la vela diaria del 10 nov. y estaban escritos
  a las 23:17 UTC; `comparacion.csv` era anterior (20:10 UTC). No hay scheduler:
  el botón Actualizar datos actualiza CSV/NPZ; el benchmark es histórico fijo.
- Mercado y predicción ahora tienen paneles y SVG independientes. Mercado usa
  OHLCV de `/api/v1/market`; predicción compara los últimos 90 cierres con el
  pronóstico de `/api/v1/predictions`. Probado con Persistencia en Azure.
- Corregida la indentación de `frontend` en Compose y la redirección de Nginx
  para conservar el puerto publicado `8081`.
- Navegador: login y dashboard con métricas cargadas; móvil de 375 px sin
  desbordamiento horizontal. API, login y dashboard responden HTTP 200.
- En VM Azure el servicio y la IP pública funcionan en TCP 8081 tras permitir
  el puerto en el NSG; UFW está inactivo.
- `docker compose build` y arranque de los dos servicios correctos.
- API: health, OHLCV, métricas, refresco y predicción naive/ARIMA/LSTM.
- `python -m pytest -q`: 17 pruebas aprobadas en el contenedor.
- UI en navegador: autenticación demo, métricas y gráfico; vista móvil de
  390 px sin desbordamiento de página.
- Gráfico: velas/línea, volumen y rangos 1M/3M/1A ya existían. Se añadieron
  SMA 9, Volumen SMA 9 y rangos diarios 1D/5D/6M. Proveedor actual no soporta
  intervalos intradía; probado con ambos indicadores y móvil sin overflow.

## Pendiente
- Arquitectura objetivo aceptada: Next.js, Node+TS, identidad Spring+PostgreSQL,
  mercado/predicciones MongoDB separado y Redis. Fase 0 en
  `docs/architecture/`; implementación incremental pendiente.
- Portal accesible en `http://57.156.63.247:8081/`; mantener el origen del NSG
  restringido a la IP del investigador mientras el login sea demo.
