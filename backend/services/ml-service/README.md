# XMR-Forecast — Predicción del precio de Monero (XMR)

Proyecto final de Sistemas Inteligentes (Universidad de Ibagué). Compara cinco
modelos de series de tiempo para predecir el cierre diario de Monero (`XMR-USD`)
con un split cronológico congelado, métricas comunes y artefactos en disco para
que el frontend no dependa de TensorFlow.

**Pregunta:** ¿una LSTM predice mejor el cierre diario de Monero que la
persistencia, la media móvil, ARIMA o una GRU?

## Modelos comparados

| # | Modelo | Objetivo | Archivo |
|---|---|---|---|
| 1 | Persistencia ("mañana = hoy") | precio | `src/models/naive.py` |
| 2 | Media móvil de 7 días | precio | `src/models/moving_average.py` |
| 3 | ARIMA(p,d,q) por AIC, walk-forward 1 paso | precio | `src/models/arima.py` |
| 4 | LSTM 2×100 + dropout 0.2 | retorno logarítmico | `src/models/lstm.py` |
| 5 | GRU 2×100 + dropout 0.2 | retorno logarítmico | `src/models/gru.py` |

Protocolo: split cronológico 80/20 sin shuffle, `MinMaxScaler` ajustado **solo
con train**, ventana de 30 días, semillas `[0, 1, 2]` en las redes y métricas
MAE, RMSE, MAPE y % de acierto de dirección sobre **los mismos 656 días**.

## Instalación

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

## Reproducir todo

```bash
# 1) Datos (descarga y actualiza hasta hoy)
python -m src.data.download

# 2) Split congelado + escaladores + ventanas (precio y retorno)
python -m src.data.prepare

# 3) Baselines y modelo estadístico
python -m src.train --modelo naive          --objetivo precio
python -m src.train --modelo moving_average --objetivo precio
python -m src.train --modelo arima          --objetivo precio

# 4) Redes recurrentes (3 semillas cada una)
python -m src.train --modelo lstm --objetivo retorno --semilla 0
python -m src.train --modelo lstm --objetivo retorno --semilla 1
python -m src.train --modelo lstm --objetivo retorno --semilla 2
python -m src.train --modelo gru  --objetivo retorno --semilla 0
python -m src.train --modelo gru  --objetivo retorno --semilla 1
python -m src.train --modelo gru  --objetivo retorno --semilla 2

# 5) Tabla comparativa (media ± desviación)
python -m src.evaluation.compare

# 6) Predicción de mañana en JSON (lo que consume el frontend)
python -m src.predict --modelo lstm --objetivo retorno --semilla 0
```

## Salidas

```
models/<modelo>_<objetivo>_seed<k>.keras|.pkl   # artefactos (no van a git)
results/metrics/<modelo>_<objetivo>_seed<k>.json
results/metrics/comparacion.csv                  # media ± desviación por modelo
results/metrics/comparacion_detalle.csv          # una fila por corrida
results/predictions/<modelo>_<objetivo>_seed<k>_test.csv
results/figures/<modelo>_<objetivo>_seed<k>.png
```

## Resultados (datos hasta 2026-10-31, test de 656 días)

| Modelo | Objetivo | MAE (USD) | RMSE (USD) | MAPE (%) | Acierto dirección (%) |
|---|---|---|---|---|---|
| Persistencia (naive) | precio | **9.69** | **15.04** | **2.68** | 1.5 |
| ARIMA(2,0,1) | precio | 9.94 | 15.40 | 2.75 | 47.1 |
| LSTM 2×100 | retorno | 9.99 ± 0.06 | 15.47 ± 0.08 | 2.76 ± 0.02 | 50.4 ± 0.5 |
| GRU 2×100 | retorno | 10.11 ± 0.24 | 15.56 ± 0.29 | 2.80 ± 0.07 | 47.9 ± 3.2 |
| Media móvil 7 días | precio | 15.20 | 25.02 | 4.12 | 54.6 |

Lectura: **ninguna red supera a la persistencia** en MAE/RMSE/MAPE, y la
diferencia entre LSTM y GRU es menor que su variación entre semillas. La media
móvil y la GRU aciertan más la dirección, pero con un error de nivel mucho mayor,
así que no son mejores para predecir el precio. Este resultado es consistente con
lo observado en el notebook del laboratorio y es la conclusión honesta del
experimento (no se debe afirmar que la LSTM "gana" si no lo hace).

## Contrato JSON para el frontend

`python -m src.predict --modelo lstm --objetivo retorno --semilla 0` imprime por
`stdout` (los logs van a `stderr`):

```json
{
  "modelo": "lstm",
  "objetivo": "retorno",
  "semilla": 0,
  "fecha_ultimo_dato": "2026-10-30",
  "fecha_prediccion": "2026-10-31",
  "precio_actual": 587.78,
  "precio_predicho": 592.1,
  "cambio_pct": 0.73,
  "direccion": "sube",
  "metricas_test": {"MAE": 12.3, "RMSE": 17.81, "MAPE": 2.79, "acierto_direccion": 51.4}
}
```

## Pruebas

```bash
python -m pytest -q
```

Cubren métricas, contrato `fit`/`predict`, ausencia de leakage y la alineación
1:1 entre ventanas, precios reales, fechas y base de retornos.

## Nota metodológica

Predecir el precio en nivel falla por escala (el train termina cerca de 250 USD y
el test llega a 713 USD). Por eso las redes se entrenan sobre el **retorno
logarítmico** y el precio se reconstruye como `precio_t = precio_{t-1} · e^{r_t}`;
las métricas se reportan siempre en USD para que los cinco modelos sean
comparables.

## Documentos

- [`Propuesta_Monero_IEEE (1) (2).docx`](Propuesta_Monero_IEEE%20(1)%20(2).docx): propuesta inicial en formato IEEE.
- [`Informe_Monero_Resultados.docx`](Informe_Monero_Resultados.docx): informe de implementación y resultados (6 páginas, 4 tablas y 3 figuras, mismo formato IEEE).

## Estructura

Ver [`ESTRUCTURA.md`](ESTRUCTURA.md) para el detalle de carpetas, interfaces y
reglas del proyecto.

## Portal AyLZz con Docker

Desde la raíz del repositorio:

```bash
docker compose up --build
```

Abre <http://localhost:8081>. El portal sirve la interfaz y una API privada
entre contenedores (`monero-api`); los volúmenes `monero-data`,
`monero-models` y `monero-results` conservan datos, modelos y resultados.
El panel lee velas OHLCV diarias y métricas del servicio. El gráfico ofrece
velas/línea, volumen, rangos 1D/5D/1M/3M/6M/1A y medias móviles de 9 días para
precio y volumen. No expone intervalos intradía porque la fuente actual solo
entrega datos diarios. **Actualizar datos** descarga
cotizaciones nuevas y prepara el dataset; **Predecir cierre** calcula el
siguiente día con una instantánea del dataset ya guardado y no modifica el
panel de mercado. Los paneles real y predictivo mantienen sus propias series.
Persistencia y media móvil no requieren entrenamiento; ARIMA, LSTM y GRU se
entrenan al solicitar la primera predicción sobre un dataset nuevo.

Compose inicia también `monero-scheduler`: descarga y prepara el OHLCV una vez
al día a las 03:15 UTC, y cada domingo a las 04:00 UTC entrena Persistencia,
Media móvil y ARIMA, además de LSTM/GRU con semillas 0, 1 y 2; después regenera
el benchmark agregado. Si una tarea falla, se reintenta cada 15 minutos. Las
horas se pueden cambiar con `DAILY_UPDATE_UTC`, `WEEKLY_RETRAIN_UTC` y
`WEEKLY_RETRAIN_DAY_UTC` en el entorno de Compose (día 0=lunes, 6=domingo).
El estado y las marcas de tiempo están disponibles en `GET /api/v1/maintenance`;
`GET /api/v1/models` también devuelve cuándo se generó el benchmark. Los CSV,
el dataset y los resultados persisten en volúmenes Docker.

Rutas de la API: `GET /api/v1/health`, `GET /api/v1/market`,
`POST /api/v1/market/refresh`, `GET /api/v1/models` y
`POST /api/v1/predictions` (JSON: `{"model":"lstm","seed":0}`).
Las predicciones son experimentales y no constituyen asesoría financiera.
