import os

import numpy as np
import pandas as pd
import pytest

from src.config import DATA_PROCESSED_DIR, DATA_RAW_DIR, WINDOW_SIZE

RUTA_NPZ = os.path.join(DATA_PROCESSED_DIR, "dataset.npz")
RUTA_CSV = os.path.join(DATA_RAW_DIR, "xmr_usd_diario.csv")

pytestmark = pytest.mark.skipif(
    not (os.path.exists(RUTA_NPZ) and os.path.exists(RUTA_CSV)),
    reason="Requiere dataset.npz y el CSV crudo (ejecuta download.py y prepare.py)",
)


def _cargar():
    return np.load(RUTA_NPZ, allow_pickle=True)


def test_todas_las_salidas_del_test_estan_alineadas():
    """X_test, y_test_real, base_precio, retornos y fechas deben tener la misma fila."""
    d = _cargar()
    n = len(d["X_test"])
    for clave in ["y_test", "y_test_real", "Xret_test", "r_test", "ret_test_real", "base_precio", "test_dates"]:
        assert len(d[clave]) == n, f"{clave} tiene {len(d[clave])} filas y X_test {n}"


def test_ventanas_continuas_sin_desfase():
    """La ultima ventana de train y la primera de test deben ser consecutivas."""
    d = _cargar()
    df = pd.read_csv(RUTA_CSV)
    df["Date"] = pd.to_datetime(df["Date"], utc=True).dt.tz_localize(None)
    df = df.dropna(subset=["Close"]).sort_values("Date").reset_index(drop=True)
    cierres = df["Close"].to_numpy(dtype=float).reshape(-1, 1)
    scaler = d["scaler"].item()

    split = len(cierres) - len(d["X_test"])
    esperado_ultimo_train = scaler.transform(cierres[split - 2:split - 1])[0, 0]
    esperado_primero_test = scaler.transform(cierres[split - 1:split])[0, 0]

    assert np.isclose(d["X_train"][-1][-1], esperado_ultimo_train)
    assert np.isclose(d["X_test"][0][-1], esperado_primero_test)


def test_precio_real_corresponde_a_la_fecha_del_objetivo():
    """y_test_real[i] debe ser el cierre de test_dates[i], y base_precio[i] el del dia anterior."""
    d = _cargar()
    df = pd.read_csv(RUTA_CSV)
    df["Date"] = pd.to_datetime(df["Date"], utc=True).dt.tz_localize(None)
    df = df.dropna(subset=["Close"]).sort_values("Date").reset_index(drop=True)

    fechas = list(df["Date"].dt.strftime("%Y-%m-%d"))
    cierres = df["Close"].to_numpy(dtype=float)

    # Primer y ultimo dia del test
    for idx in [0, len(d["test_dates"]) - 1]:
        fecha = str(d["test_dates"][idx])
        pos = fechas.index(fecha)
        assert np.isclose(cierres[pos], float(d["y_test_real"][idx][0] if d["y_test_real"].ndim > 1 else d["y_test_real"][idx]))
        assert np.isclose(cierres[pos - 1], float(d["base_precio"][idx][0] if d["base_precio"].ndim > 1 else d["base_precio"][idx]))


def test_retorno_logaritmico_reconstruye_el_precio():
    d = _cargar()
    base = d["base_precio"].reshape(-1)
    ret = d["ret_test_real"].reshape(-1)
    real = d["y_test_real"].reshape(-1)
    np.testing.assert_allclose(base * np.exp(ret), real, rtol=1e-6, atol=1e-4)


def test_ventana_tiene_el_tamano_configurado():
    d = _cargar()
    assert d["X_test"].shape[1] == WINDOW_SIZE
    assert d["Xret_test"].shape[1] == WINDOW_SIZE
