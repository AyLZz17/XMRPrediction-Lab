import csv

import pandas as pd
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src import api


def test_market_returns_recent_real_ohlcv_rows(tmp_path, monkeypatch):
    source = tmp_path / "market.csv"
    pd.DataFrame(
        [
            ["2025-01-01", 10, 12, 9, 11, 100],
            ["2025-01-02", 11, 13, 10, 12, 200],
            ["2025-01-03", 12, 14, 11, 13, 300],
        ],
        columns=["Date", "Open", "High", "Low", "Close", "Volume"],
    ).to_csv(source, index=False)
    monkeypatch.setattr(api, "DATA_FILE", source)

    result = api._read_market(2)

    assert result["total_count"] == 3
    assert result["latest"]["date"] == "2025-01-03"
    assert result["latest"]["high"] == 14
    assert result["change_pct"] == pytest.approx(100 / 12, abs=0.0001)
    assert [row["date"] for row in result["rows"]] == ["2025-01-02", "2025-01-03"]


def test_market_rejects_csv_without_ohlcv(tmp_path, monkeypatch):
    source = tmp_path / "invalid.csv"
    source.write_text("Date,Close\n2025-01-01,10\n", encoding="utf-8")
    monkeypatch.setattr(api, "DATA_FILE", source)

    with pytest.raises(HTTPException) as error:
        api._read_market(30)

    assert error.value.status_code == 503


def test_models_reads_comparison_metrics(tmp_path, monkeypatch):
    source = tmp_path / "comparacion.csv"
    with source.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=[
            "modelo", "objetivo", "n_semillas", "mae_media", "rmse_media",
            "mape_media", "acierto_direccion_media",
        ])
        writer.writeheader()
        writer.writerow({
            "modelo": "naive", "objetivo": "precio", "n_semillas": 1,
            "mae_media": 2, "rmse_media": 3, "mape_media": 4,
            "acierto_direccion_media": 5,
        })
    monkeypatch.setattr(api, "METRICS_FILE", source)

    result = api.models()
    assert result["models"] == [{
        "id": "naive", "name": "Persistencia", "objective": "precio",
        "seeds": 1, "mae": 2, "rmse": 3, "mape": 4, "direction": 5,
    }]
    assert result["updated_at"] is not None


def test_prediction_request_rejects_unregistered_model():
    with pytest.raises(ValidationError):
        api.PredictionRequest(model="other")


def test_prediction_uses_saved_market_without_refresh(tmp_path, monkeypatch):
    source = tmp_path / "market.csv"
    source.write_text("saved market", encoding="utf-8")
    saved_market = {"rows": [{"date": "2026-11-10", "close": 500.0}]}
    prediction = {"modelo": "naive", "precio_predicho": 500.0}

    monkeypatch.setattr(api, "DATA_FILE", source)
    monkeypatch.setattr(api, "_read_market", lambda limit: saved_market)
    monkeypatch.setattr(api, "_refresh_market", lambda: pytest.fail("prediction refreshed market"))
    monkeypatch.setattr(api, "_ensure_model_trained", lambda *args: None)
    monkeypatch.setattr(api, "predecir", lambda *args: prediction)

    result = api.create_prediction(api.PredictionRequest(model="naive"))

    assert result == {"prediction": prediction, "market": saved_market}


def test_maintenance_reports_schedule_and_persisted_file_dates():
    result = api.maintenance()

    assert result["timezone"] == "UTC"
    assert result["schedule"]["daily_update_utc"] == "03:15"
    assert result["schedule"]["weekly_retrain_day_utc"] == 6
    assert result["schedule"]["weekly_retrain_utc"] == "04:00"
    assert result["next_runs"]["daily_update_at"]
    assert result["next_runs"]["weekly_retrain_at"]
    assert set(result["files"]) == {
        "ohlcv_updated_at", "dataset_updated_at", "benchmark_updated_at"
    }
