import os
import json
import time
import random
import argparse
import numpy as np

from src.config import (
    DATA_PROCESSED_DIR,
    MODELS_DIR,
    RESULTS_METRICS_DIR,
    RESULTS_PRED_DIR,
    RESULTS_FIG_DIR,
)
from src import REGISTRY

OBJETIVOS = ("precio", "retorno")
MODELOS_RETORNO = ("lstm", "gru")


def _fijar_semillas(semilla, usar_tf=False):
    random.seed(semilla)
    np.random.seed(semilla)
    if usar_tf:
        import tensorflow as tf

        tf.random.set_seed(semilla)


def _cargar_dataset(objetivo):
    ruta = os.path.join(DATA_PROCESSED_DIR, "dataset.npz")
    if not os.path.exists(ruta):
        raise FileNotFoundError(
            f"No se encontro {ruta}. Ejecuta primero: python -m src.data.prepare"
        )

    data = np.load(ruta, allow_pickle=True)

    if objetivo == "precio":
        return {
            "X_train": data["X_train"],
            "y_train": data["y_train"],
            "X_test": data["X_test"],
            "y_test": data["y_test"],
            "y_test_real": data["y_test_real"].flatten(),
            "scaler": data["scaler"].item(),
            "fechas": data["test_dates"].astype(str),
            "base_precio": data["base_precio"].flatten(),
        }

    return {
        "X_train": data["Xret_train"],
        "y_train": data["r_train"],
        "X_test": data["Xret_test"],
        "y_test": data["r_test"],
        "y_test_real": data["y_test_real"].flatten(),
        "scaler": data["ret_scaler"].item(),
        "fechas": data["test_dates"].astype(str),
        "base_precio": data["base_precio"].flatten(),
    }


def _guardar_figura(nombre, fechas, real, pred, ruta):
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(11, 4.5))
    ax.plot(fechas, real, label="Real", linewidth=1.4)
    ax.plot(fechas, pred, label="Predicho", linewidth=1.2, alpha=0.85)
    ax.set_title(f"XMR-USD - {nombre}")
    ax.set_ylabel("Precio (USD)")
    ax.legend()
    ax.grid(alpha=0.3)
    fig.autofmt_xdate()
    fig.tight_layout()
    fig.savefig(ruta, dpi=120)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description="Entrena y evalua un modelo.")
    parser.add_argument("--modelo", type=str, required=True, choices=list(REGISTRY.keys()))
    parser.add_argument("--objetivo", type=str, default="precio", choices=list(OBJETIVOS))
    parser.add_argument("--semilla", type=int, default=0)
    args = parser.parse_args()

    if args.objetivo == "retorno" and args.modelo not in MODELOS_RETORNO:
        raise SystemExit(
            f"El objetivo 'retorno' solo aplica a {MODELOS_RETORNO}. "
            f"Entrena '{args.modelo}' con --objetivo precio."
        )

    print(
        f"--- Entrenando {args.modelo.upper()} | objetivo: {args.objetivo} | "
        f"semilla: {args.semilla} ---"
    )

    _fijar_semillas(args.semilla, usar_tf=REGISTRY[args.modelo].extension == ".keras")
    ds = _cargar_dataset(args.objetivo)

    modelo = REGISTRY[args.modelo]()

    t0 = time.perf_counter()
    modelo.fit(ds["X_train"], ds["y_train"])
    preds_objetivo = modelo.predict(ds["X_test"], scaler=ds["scaler"])
    segundos = time.perf_counter() - t0

    # Reconstruccion a precio USD
    if args.objetivo == "retorno":
        # El modelo devuelve el retorno logaritmico predicho: precio = base * exp(r)
        preds_usd = ds["base_precio"] * np.exp(preds_objetivo)
    else:
        preds_usd = preds_objetivo

    y_real = ds["y_test_real"]
    min_len = min(len(y_real), len(preds_usd))
    y_real, preds_usd = y_real[:min_len], preds_usd[:min_len]
    base = ds["base_precio"][:min_len]
    fechas = ds["fechas"][:min_len]

    from src.evaluation.metrics import mae, rmse, mape, acierto_direccion

    metrics = {
        "modelo": args.modelo,
        "objetivo": args.objetivo,
        "semilla": args.semilla,
        "mae": mae(y_real, preds_usd),
        "rmse": rmse(y_real, preds_usd),
        "mape": mape(y_real, preds_usd),
        "acierto_direccion": acierto_direccion(y_real, preds_usd, y_base=base),
        "segundos_entrenamiento": round(segundos, 2),
        "n_test": int(min_len),
    }

    print("\nResultados de evaluacion:")
    for k, v in metrics.items():
        print(f"  - {k}: {v}")

    # Artefactos
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(RESULTS_METRICS_DIR, exist_ok=True)
    os.makedirs(RESULTS_PRED_DIR, exist_ok=True)
    os.makedirs(RESULTS_FIG_DIR, exist_ok=True)

    nombre = f"{args.modelo}_{args.objetivo}_seed{args.semilla}"

    ruta_modelo = os.path.join(MODELS_DIR, nombre + modelo.extension)
    try:
        modelo.save(ruta_modelo)
        print(f"Modelo guardado en: {ruta_modelo}")
    except Exception as exc:  # noqa: BLE001
        print(f"Aviso al guardar modelo: {exc}")

    ruta_metrics = os.path.join(RESULTS_METRICS_DIR, nombre + ".json")
    with open(ruta_metrics, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=4, ensure_ascii=False)

    # Predicciones dia por dia (date, y_true, y_pred)
    ruta_pred = os.path.join(RESULTS_PRED_DIR, nombre + "_test.csv")
    with open(ruta_pred, "w", encoding="utf-8") as f:
        f.write("date,y_true,y_pred\n")
        for fecha, real, pred in zip(fechas, y_real, preds_usd):
            f.write(f"{fecha},{real:.6f},{pred:.6f}\n")

    ruta_fig = os.path.join(RESULTS_FIG_DIR, nombre + ".png")
    try:
        _guardar_figura(nombre, fechas, y_real, preds_usd, ruta_fig)
    except Exception as exc:  # noqa: BLE001
        print(f"Aviso al generar figura: {exc}")

    print(f"Metricas: {ruta_metrics}")
    print(f"Predicciones: {ruta_pred}")
    print(f"Figura: {ruta_fig}\n")


if __name__ == "__main__":
    main()
