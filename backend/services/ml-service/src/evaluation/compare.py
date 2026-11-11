import os
import glob
import json
import pandas as pd
from src.config import RESULTS_METRICS_DIR, RESULTS_FIG_DIR

METRICAS = ["mae", "rmse", "mape", "acierto_direccion", "segundos_entrenamiento"]


def _graficar_comparacion(resumen):
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    os.makedirs(RESULTS_FIG_DIR, exist_ok=True)
    etiquetas = [f"{f['modelo']}\n({f['objetivo']})" for _, f in resumen.iterrows()]
    fig, ax = plt.subplots(figsize=(9, 4.5))
    ax.bar(etiquetas, resumen["mae_media"], yerr=resumen.get("mae_std"), capsize=4, color="#4C72B0")
    ax.set_ylabel("MAE (USD, menor es mejor)")
    ax.set_title("Comparacion de modelos - XMR-USD")
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    ruta = os.path.join(RESULTS_FIG_DIR, "comparacion_mae.png")
    fig.savefig(ruta, dpi=120)
    plt.close(fig)
    print(f"Figura comparativa: {ruta}")


def _guardar_csv_atomico(frame, ruta):
    temporal = f"{ruta}.tmp"
    try:
        frame.to_csv(temporal, index=False, encoding="utf-8")
        os.replace(temporal, ruta)
    finally:
        if os.path.exists(temporal):
            os.remove(temporal)


def comparar_modelos():
    """
    Consolida results/metrics/*.json en:
      - comparacion.csv: media +/- desviacion por modelo y objetivo (3 semillas)
      - comparacion_detalle.csv: una fila por corrida
    """
    archivos = sorted(glob.glob(os.path.join(RESULTS_METRICS_DIR, "*.json")))
    if not archivos:
        print(f"No se encontraron metricas en {RESULTS_METRICS_DIR}. Entrena algun modelo primero.")
        return

    registros = []
    for archivo in archivos:
        try:
            with open(archivo, "r", encoding="utf-8") as f:
                registros.append(json.load(f))
        except Exception as exc:  # noqa: BLE001
            print(f"Error leyendo {archivo}: {exc}")

    if not registros:
        print("No hay registros validos para comparar.")
        return

    df = pd.DataFrame(registros)
    df = df.sort_values(["modelo", "objetivo", "semilla"]).reset_index(drop=True)

    detalle_csv = os.path.join(RESULTS_METRICS_DIR, "comparacion_detalle.csv")
    _guardar_csv_atomico(df, detalle_csv)

    filas = []
    for (modelo, objetivo), grupo in df.groupby(["modelo", "objetivo"], sort=False):
        fila = {
            "modelo": modelo,
            "objetivo": objetivo,
            "n_semillas": int(grupo["semilla"].nunique()),
        }
        for metrica in METRICAS:
            if metrica in grupo.columns:
                fila[f"{metrica}_media"] = round(float(grupo[metrica].mean()), 4)
                fila[f"{metrica}_std"] = round(float(grupo[metrica].std(ddof=0)), 4)
        filas.append(fila)

    resumen = pd.DataFrame(filas).sort_values("mae_media").reset_index(drop=True)
    resumen_csv = os.path.join(RESULTS_METRICS_DIR, "comparacion.csv")
    _guardar_csv_atomico(resumen, resumen_csv)

    try:
        _graficar_comparacion(resumen)
    except Exception as exc:  # noqa: BLE001
        print(f"Aviso al graficar la comparacion: {exc}")

    print(f"Tabla comparativa: {resumen_csv}")
    print(f"Detalle por semilla: {detalle_csv}\n")
    print("=" * 100)
    print("TABLA COMPARATIVA (media +/- desviacion, ordenada por MAE)")
    print("=" * 100)
    print(resumen.to_string(index=False))
    print("=" * 100)


if __name__ == "__main__":
    comparar_modelos()
