"""HTTP API connecting the Monero data pipeline to the dashboard."""

import csv
import datetime as dt
import hashlib
import json
import subprocess
import sys
import threading
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from src.config import DATA_RAW_DIR, MODELS_DIR, RESULTS_METRICS_DIR
from src.data.download import descargar_datos_xmr
from src.data.prepare import preparar_datos
from src.predict import predecir
from src import REGISTRY
from src.pipeline_lock import pipeline_lock
from src.scheduler import maintenance_status


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_FILE = Path(DATA_RAW_DIR) / "xmr_usd_diario.csv"
METRICS_FILE = Path(RESULTS_METRICS_DIR) / "comparacion.csv"
PREDICTION_LOCK = threading.Lock()
BASELINE_MODELS = {"naive", "moving_average"}
MODEL_LABELS = {
    "naive": "Persistencia",
    "moving_average": "Media móvil 7",
    "arima": "ARIMA",
    "lstm": "LSTM",
    "gru": "GRU",
}

app = FastAPI(title="AyLZz Monero Forecast API", version="1.0.0")


class PredictionRequest(BaseModel):
    model: str = Field(pattern=r"^(naive|moving_average|arima|lstm|gru)$")
    seed: int = Field(default=0, ge=0, le=10000)


def _read_market(limit: int) -> dict:
    if not DATA_FILE.is_file():
        raise HTTPException(
            status_code=503,
            detail="No hay datos de Monero. Actualiza los datos para iniciar el servicio.",
        )

    frame = pd.read_csv(DATA_FILE)
    required = {"Date", "Open", "High", "Low", "Close", "Volume"}
    if not required.issubset(frame.columns):
        raise HTTPException(status_code=503, detail="El CSV de Monero no contiene OHLCV completo.")

    frame["Date"] = pd.to_datetime(frame["Date"], utc=True, errors="coerce")
    for column in ("Open", "High", "Low", "Close", "Volume"):
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    frame = frame.dropna(subset=["Date", "Open", "High", "Low", "Close"])
    frame = frame.sort_values("Date")
    if frame.empty:
        raise HTTPException(status_code=503, detail="El CSV de Monero no contiene observaciones válidas.")

    total_count = len(frame)
    recent = frame.tail(limit)
    rows = [
        {
            "date": row.Date.strftime("%Y-%m-%d"),
            "open": float(row.Open),
            "high": float(row.High),
            "low": float(row.Low),
            "close": float(row.Close),
            "volume": float(row.Volume) if pd.notna(row.Volume) else 0.0,
        }
        for row in recent.itertuples(index=False)
    ]
    latest = rows[-1]
    previous_close = rows[-2]["close"] if len(rows) > 1 else latest["close"]
    change_pct = (
        (latest["close"] - previous_close) / previous_close * 100
        if previous_close
        else 0.0
    )
    updated_at = dt.datetime.fromtimestamp(
        DATA_FILE.stat().st_mtime, tz=dt.timezone.utc
    ).isoformat()

    return {
        "symbol": "XMR-USD",
        "total_count": total_count,
        "updated_at": updated_at,
        "latest": latest,
        "change_pct": round(change_pct, 4),
        "rows": rows,
    }


def _refresh_market() -> dict:
    descargar_datos_xmr()
    preparar_datos()
    return _read_market(365)


def _ensure_model_trained(model_name: str, objective: str, seed: int, dataset_hash: str) -> None:
    if model_name in BASELINE_MODELS:
        return

    model_class = REGISTRY[model_name]
    artifact = Path(MODELS_DIR) / f"{model_name}_{objective}_seed{seed}{model_class.extension}"
    marker = Path(MODELS_DIR) / f"{model_name}_{objective}_seed{seed}.live.json"
    if artifact.is_file() and marker.is_file():
        with marker.open(encoding="utf-8") as file:
            if json.load(file).get("dataset_sha256") == dataset_hash:
                return

    command = [
        sys.executable,
        "-m",
        "src.train",
        "--modelo",
        model_name,
        "--objetivo",
        objective,
        "--semilla",
        str(seed),
    ]
    try:
        result = subprocess.run(
            command,
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=3600,
            check=False,
        )
    except subprocess.TimeoutExpired as error:
        raise HTTPException(
            status_code=504,
            detail=f"El entrenamiento de {MODEL_LABELS[model_name]} superó el límite de una hora.",
        ) from error
    if result.returncode:
        message = (result.stderr or result.stdout).strip()
        raise HTTPException(
            status_code=503,
            detail=f"No se pudo entrenar {MODEL_LABELS[model_name]}: {message[-1500:]}",
        )
    if not artifact.is_file():
        raise HTTPException(
            status_code=503,
            detail=f"El entrenamiento de {MODEL_LABELS[model_name]} terminó sin guardar el modelo.",
        )

    marker.parent.mkdir(parents=True, exist_ok=True)
    with marker.open("w", encoding="utf-8") as file:
        json.dump({"dataset_sha256": dataset_hash}, file)


@app.get("/api/v1/health")
def health() -> dict:
    return {"status": "ok", "service": "monero"}


@app.get("/api/v1/maintenance")
def maintenance() -> dict:
    return maintenance_status()


@app.get("/api/v1/market")
def market(limit: int = Query(default=365, ge=1, le=3650)) -> dict:
    return _read_market(limit)


@app.post("/api/v1/market/refresh")
def refresh_market() -> dict:
    with PREDICTION_LOCK, pipeline_lock():
        return _refresh_market()


@app.get("/api/v1/models")
def models() -> dict:
    if not METRICS_FILE.is_file():
        return {"models": [], "updated_at": None}

    with METRICS_FILE.open(newline="", encoding="utf-8") as file:
        records = list(csv.DictReader(file))
    result = []
    for row in records:
        model_name = row.get("modelo", "")
        if model_name not in MODEL_LABELS:
            raise HTTPException(
                status_code=503,
                detail=f"Métrica para modelo desconocido: {model_name}.",
            )
        try:
            result.append(
                {
                    "id": model_name,
                    "name": MODEL_LABELS[model_name],
                    "objective": row["objetivo"],
                    "seeds": int(row["n_semillas"]),
                    "mae": float(row["mae_media"]),
                    "rmse": float(row["rmse_media"]),
                    "mape": float(row["mape_media"]),
                    "direction": float(row["acierto_direccion_media"]),
                }
            )
        except (KeyError, ValueError) as error:
            raise HTTPException(
                status_code=503,
                detail="El archivo de métricas contiene una fila inválida.",
            ) from error
    result.sort(key=lambda model: model["mae"])
    updated_at = dt.datetime.fromtimestamp(
        METRICS_FILE.stat().st_mtime, tz=dt.timezone.utc
    ).isoformat()
    return {"models": result, "updated_at": updated_at}


@app.post("/api/v1/predictions")
def create_prediction(request: PredictionRequest) -> dict:
    objective = "retorno" if request.model in {"lstm", "gru"} else "precio"
    with PREDICTION_LOCK, pipeline_lock():
        current_market = _read_market(365)
        dataset_hash = hashlib.sha256(DATA_FILE.read_bytes()).hexdigest()
        _ensure_model_trained(request.model, objective, request.seed, dataset_hash)
        prediction = predecir(request.model, objective, request.seed)
        return {"prediction": prediction, "market": current_market}
