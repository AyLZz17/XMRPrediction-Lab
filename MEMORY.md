# MEMORY.md -- Memoria de corto plazo (max. 50 lineas)
> Reescribir tras cada tarea; lo permanente va en AGENTS.md.

## Contexto actual
- AyLZz Crypto Lab es un portal preliminar para análisis diario de Monero
  (XMR-USD); arquitectura y planeación finales pendientes del usuario.
- Docker Compose integra frontend Nginx y API FastAPI en `Monero/src/api.py`.
- Datos Yahoo Finance -> `Monero/data/raw/xmr_usd_diario.csv` -> preparación
  del dataset -> predicción de cierre del siguiente día.
- La UI consume velas OHLCV reales, benchmark de métricas y resultados del API.
- Persistencia/media móvil no entrenan; ARIMA/LSTM/GRU entrenan al detectar un
  dataset nuevo. Volúmenes Docker conservan datos, modelos y resultados.
- Acceso local de demostración solamente; no es asesoría financiera.

## Verificado en esta tarea
- `docker compose build` y arranque de los dos servicios correctos.
- API: health, OHLCV, métricas, refresco y predicción naive/ARIMA/LSTM.
- `python -m pytest -q`: 17 pruebas aprobadas en el contenedor.
- UI en navegador: autenticación demo, métricas y gráfico; vista móvil de
  390 px sin desbordamiento de página.
- Gráfico: velas/línea, volumen y rangos 1M/3M/1A ya existían. Se añadieron
  SMA 9, Volumen SMA 9 y rangos diarios 1D/5D/6M. Proveedor actual no soporta
  intervalos intradía; probado con ambos indicadores y móvil sin overflow.

## Pendiente
- Incorporar la arquitectura y planeación que entregará el usuario.
- Ejecutar `docker compose up --build` desde la raíz para iniciar el portal en
  `http://localhost:8081` (el puerto 8080 ya estaba ocupado en este equipo).
