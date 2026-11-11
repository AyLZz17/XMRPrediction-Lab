# ESTRUCTURA.md — Proyecto Monero (Fase 1)

**Objetivo:** predecir el cierre diario de Monero (XMR) comparando 5 modelos, con un archivo `.py` independiente por modelo y una interfaz común para que el frontend consuma resultados sin acoplarse al código de entrenamiento.

**Fuente de datos única:** `yfinance` → ticker `XMR-USD` (2017-11-09 → hoy, se actualiza en cada ejecución).

---

## 1. Principio de diseño

| Regla | Por qué |
|---|---|
| **Un `.py` por modelo** | tu compañero conecta cada uno por separado; puedes entrenar/romper uno sin tocar los demás |
| **Misma interfaz `fit()` / `predict()`** | el pipeline y el frontend no saben si por dentro hay un ARIMA o una LSTM |
| **Un solo `config.py`** | ventana, split, semillas y rutas se cambian en un solo lugar (nada de números mágicos repetidos) |
| **Un solo split congelado** | los 5 modelos se evalúan sobre **los mismos 656 días**; si no, la comparación no vale |
| **Artefactos en disco** | el frontend nunca importa TensorFlow: lee CSV/JSON |

---

## 2. Árbol de carpetas

```
proyecto final/
├── ESTRUCTURA.md
├── README.md
├── requirements.txt
├── .gitignore
│
├── data/
│   ├── raw/
│   │   └── xmr_usd_diario.csv          # salida de download.py (se regenera sola)
│   └── processed/
│       └── dataset.npz                 # split congelado + scaler + ventanas
│
├── src/
│   ├── __init__.py
│   ├── config.py                       # ÚNICO lugar con constantes
│   │
│   ├── data/
│   │   ├── __init__.py
│   │   ├── download.py                 # yfinance → data/raw/
│   │   └── prepare.py                  # limpieza, split, scaler, ventanas → data/processed/
│   │
│   ├── models/
│   │   ├── __init__.py                 # REGISTRO: {"naive": ..., "lstm": ...}
│   │   ├── base.py                     # clase ModeloBase (contrato)
│   │   ├── naive.py                    # 1. persistencia "mañana = hoy"
│   │   ├── moving_average.py           # 2. media móvil 7 días
│   │   ├── arima.py                    # 3. ARIMA(p,d,q) por AIC
│   │   ├── lstm.py                     # 4. LSTM
│   │   └── gru.py                      # 5. GRU
│   │
│   ├── evaluation/
│   │   ├── __init__.py
│   │   ├── metrics.py                  # MAE, RMSE, MAPE, acierto de dirección
│   │   └── compare.py                  # corre los 5 modelos y arma la tabla final
│   │
│   ├── train.py                        # CLI: entrena UN modelo
│   └── predict.py                      # CLI: predice mañana con un modelo guardado → JSON
│
├── models/                             # artefactos entrenados (NO va a git)
│   ├── lstm_retorno_seed0.keras
│   ├── lstm_retorno_scaler.json
│   ├── arima_precio.pkl
│   └── ...
│
├── results/
│   ├── metrics/
│   │   ├── lstm_retorno.json           # métricas de una corrida
│   │   └── comparacion.csv             # tabla final para el artículo
│   ├── predictions/
│   │   └── lstm_retorno_test.csv       # date, y_true, y_pred
│   └── figures/
│       └── lstm_retorno.png
│
└── tests/
    ├── test_metrics.py
    ├── test_no_leakage.py
    └── test_contract.py                # todos los modelos cumplen fit/predict
```

---

## 3. Responsabilidad de cada archivo

| Archivo | Hace | Quién lo toca |
|---|---|---|
| `src/config.py` | constantes: `TICKER`, `START`, `WINDOW`, `TRAIN_FRAC`, `SEEDS`, rutas, `OBJETIVOS` | tú (una vez) |
| `src/data/download.py` | descarga y guarda `data/raw/xmr_usd_diario.csv`; valida nulos y huecos | nadie más |
| `src/data/prepare.py` | ordena, calcula retornos, ajusta el scaler **solo con train**, crea ventanas, guarda `dataset.npz` | nadie más |
| `src/models/base.py` | clase abstracta `ModeloBase` + `@register("nombre")` | tú (una vez) |
| `src/models/*.py` | **un modelo cada uno**, solo `fit` y `predict` | tú, uno por uno |
| `src/evaluation/metrics.py` | funciones puras: `mae`, `rmse`, `mape`, `acierto_direccion` | tú (una vez) |
| `src/evaluation/compare.py` | itera el registro, entrena, evalúa y escribe `comparacion.csv` | tú |
| `src/train.py` | CLI para entrenar un modelo y guardar artefacto + métricas | tú / scripts |
| `src/predict.py` | CLI que carga el artefacto y devuelve el JSON del día siguiente | **tu compañero (frontend)** |

---

## 4. La interfaz común (esto es lo que hace que "se conecten uno por uno")

`src/models/base.py`:

```python
from dataclasses import dataclass
import numpy as np

@dataclass
class Dataset:
    fechas: np.ndarray        # fechas del conjunto de test
    close: np.ndarray         # precio real (n,)
    X: np.ndarray             # ventanas (n, window, features)
    y: np.ndarray             # objetivo escalado (n, 1)
    scaler: object            # MinMaxScaler ajustado SOLO con train

REGISTRO = {}

def register(nombre):
    def deco(cls):
        REGISTRO[nombre] = cls
        return cls
    return deco

class ModeloBase:
    nombre = "base"

    def fit(self, ds_train: Dataset) -> None:
        raise NotImplementedError

    def predict(self, ds_test: Dataset) -> np.ndarray:
        """Devuelve PRECIOS en USD (n,), ya desescalados."""
        raise NotImplementedError

    def save(self, ruta: str) -> None: ...
    @classmethod
    def load(cls, ruta: str) -> "ModeloBase": ...
```

Cada modelo nuevo solo hereda y se registra:

```python
# src/models/gru.py
from .base import ModeloBase, register, Dataset

@register("gru")
class GRU(ModeloBase):
    def fit(self, ds): ...
    def predict(self, ds): ...   # devuelve precios en USD
```

`compare.py` entonces no necesita saber nada de cada modelo:

```python
for nombre, clase in REGISTRO.items():
    modelo = clase(**config)
    modelo.fit(train)
    pred = modelo.predict(test)
    guardar_metricas(nombre, pred)
```

---

## 5. Orden de ejecución

```bash
# 0) entorno
pip install -r requirements.txt          # statsmodels falta en tu venv

# 1) datos (siempre primero; se actualiza hasta hoy)
python -m src.data.download

# 2) split congelado (una vez; lo usan TODOS los modelos)
python -m src.data.prepare

# 3) modelos, uno por uno
python -m src.train --modelo naive          --objetivo precio
python -m src.train --modelo moving_average --objetivo precio
python -m src.train --modelo arima          --objetivo precio
python -m src.train --modelo lstm           --objetivo retorno --semilla 0
python -m src.train --modelo gru            --objetivo retorno --semilla 0

# 4) tabla comparativa final (results/metrics/comparacion.csv)
python -m src.evaluation.compare

# 5) predicción del día siguiente (lo que consume el frontend)
python -m src.predict --modelo lstm --objetivo retorno
```

---

## 6. Contrato con el frontend

**No** importes `tensorflow` desde el frontend. Consume solo estos dos formatos:

**a) `results/metrics/comparacion.csv`** — para la tabla del artículo y del dashboard

```csv
modelo,objetivo,MAE,RMSE,MAPE,acierto_direccion,segundos_entrenamiento
naive,precio,12.41,18.02,2.85,0.00,0.0
moving_average,precio,13.90,19.77,3.19,48.3,0.0
arima,precio,12.88,18.44,2.94,50.1,4.2
lstm,retorno,12.30,17.81,2.79,51.4,38.7
gru,retorno,12.27,17.76,2.78,51.9,42.1
```

**b) `python -m src.predict` → JSON por stdout**

```json
{
  "modelo": "lstm",
  "objetivo": "retorno",
  "fecha_ultimo_dato": "2026-10-30",
  "fecha_prediccion": "2026-10-31",
  "precio_actual": 587.78,
  "precio_predicho": 592.10,
  "cambio_pct": 0.73,
  "direccion": "sube",
  "metricas_test": {
    "MAE": 12.30,
    "RMSE": 17.81,
    "MAPE": 2.79,
    "acierto_direccion": 51.4
  }
}
```

Cuando el frontend esté listo, ese JSON se envuelve en un `FastAPI` (`GET /prediccion`) sin tocar nada del entrenamiento.

---

## 7. Reglas que no se negocian

1. **Sin shuffle** y split cronológico 80/20 → train 2.622 / test 656.
2. **Scaler ajustado solo con train** (si no, hay data leakage y el profe lo va a preguntar).
3. **Mismo test para todos**: por eso el split se congela en `dataset.npz`.
4. **Semillas fijas** `[0, 1, 2]` y reportar media ± desviación (el notebook ya demostró que una sola corrida no concluye nada).
5. **Objetivo `retorno`** para las redes: el test llega a 713 USD y el train termina cerca de 250, así que predecir el precio en nivel falla por escala (mismo problema que NVDA en el notebook).
6. **Cada modelo escribe su propio `results/metrics/<modelo>_<objetivo>.json`**; nadie sobrescribe la tabla global.

---

## 8. Convención de nombres de artefactos

```
models/<modelo>_<objetivo>_seed<k>.keras     # redes
models/<modelo>_<objetivo>.pkl               # arima, naive, media móvil
models/<modelo>_<objetivo>_scaler.json       # min/max usados al entrenar
results/metrics/<modelo>_<objetivo>_seed<k>.json
results/predictions/<modelo>_<objetivo>_seed<k>_test.csv
results/figures/<modelo>_<objetivo>_seed<k>.png
```

---

## 9. `.gitignore`

```
models/
results/figures/
__pycache__/
*.pyc
.venv/
```

`data/raw/xmr_usd_diario.csv` **sí** se versiona (son ~300 KB y garantiza reproducibilidad aunque Yahoo cambie).

---

## 10. Checklist de entrega

- [x] `python -m src.data.download` corre limpio y reporta filas/nulos/huecos
- [x] `python -m src.data.prepare` genera `dataset.npz` con el split congelado y **salidas alineadas 1:1** (656 filas en ventanas, precios reales, fechas y base de retornos)
- [x] los 5 modelos pasan `pytest tests/` (contrato + no leakage + métricas + alineación)
- [x] `comparacion.csv` con los 5 modelos y las 4 métricas del documento (MAE, RMSE, MAPE, dirección)
- [x] `predict.py` devuelve JSON válido con el precio de mañana
- [x] gráficas real vs predicho por modelo en `results/figures/`
- [x] `README.md` con los comandos exactos para reproducir todo
- [ ] documento IEEE: quitar la regresión lineal de los 4 puntos y alinear §VII.C con la arquitectura/ventana reales
