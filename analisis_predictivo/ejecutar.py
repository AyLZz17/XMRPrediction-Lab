"""Backtests cronológicos sencillos sobre cuatro series relacionadas con EDA."""
from pathlib import Path
import sys

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "analisis_datos"))
from comun import cargar_datos, estilo, preparar_salida


def metricas(nombre, real, pred, n):
    e = np.asarray(real) - np.asarray(pred)
    return {"serie_hallazgo": nombre, "n_test": n, "MAE": np.mean(np.abs(e)), "RMSE": np.sqrt(np.mean(e**2))}


def main():
    df = cargar_datos()
    out = preparar_salida(Path(__file__).resolve().parent)
    cut = int(len(df) * .8)
    train, test = df.iloc[:cut], df.iloc[cut:]
    rows, details = [], []

    # 1) Cierre: persistencia contra media móvil 7d, corte cronológico 80/20.
    actual = test.Close.to_numpy()
    persistence = df.Close.shift(1).loc[test.index].to_numpy()
    ma7 = df.Close.shift(1).rolling(7).mean().loc[test.index].to_numpy()
    rows += [metricas("Cierre · persistencia", actual, persistence, len(actual)), metricas("Cierre · media móvil 7", actual, ma7, len(actual))]

    # 2) Riesgo: promedio móvil de siete días del rango intradía porcentual.
    vol = df.rango_pct
    pred_vol = vol.shift(1).rolling(7).mean().loc[test.index].dropna()
    real_vol = vol.loc[pred_vol.index]
    rows.append(metricas("Rango diario porcentual · MA7", real_vol, pred_vol, len(real_vol)))

    # 3) Actividad: predecir volumen en log-escala con MA7 y evaluar log-RMSE.
    log_volume = np.log1p(df.Volume)
    pred_v = log_volume.shift(1).rolling(7).mean().loc[test.index].dropna()
    real_v = log_volume.loc[pred_v.index]
    rows.append(metricas("Log volumen · MA7", real_v, pred_v, len(real_v)))

    # 4) Día de semana: media histórica del retorno por categoría, solo pasado.
    # Cada predicción usa exclusivamente observaciones anteriores a su fecha.
    pred_week = []
    for i in range(cut, len(df)):
        hist = df.iloc[:i]
        day = df.index[i].day_name()
        pred_week.append(hist.loc[hist.index.day_name() == day, "retorno_pct"].mean())
    y_week = test.retorno_pct.to_numpy()
    valid = np.isfinite(y_week) & np.isfinite(pred_week)
    rows.append(metricas("Retorno por categoría día · media expansiva", y_week[valid], np.asarray(pred_week)[valid], int(valid.sum())))

    # Mes calendario: cada mes se pronostica con la media disponible de ese mes
    # calendario, frente a un promedio global expansivo; ambos sin mirar futuro.
    monthly = df.retorno_pct.resample("MS").mean().dropna()
    month_test_start = monthly.index[int(len(monthly) * .8)]
    mtrain = monthly.loc[monthly.index < month_test_start]
    mtest = monthly.loc[monthly.index >= month_test_start]
    pred_month, global_month = [], []
    for date in mtest.index:
        hist = monthly.loc[monthly.index < date]
        same = hist[hist.index.month == date.month]
        pred_month.append(same.mean() if len(same) else hist.mean())
        global_month.append(hist.mean())
    rows.append(metricas("Retorno mensual por categoría mes · media expansiva", mtest.to_numpy(), pred_month, len(mtest)))
    rows.append(metricas("Retorno mensual · media expansiva de referencia", mtest.to_numpy(), global_month, len(mtest)))

    results = pd.DataFrame(rows)
    results.to_csv(out / "metricas_backtest.csv", index=False)
    # Forecast no operativo: próximo cierre base = último cierre, sin intervalo.
    pd.DataFrame([{"fecha_base_utc": df.index[-1].date(), "cierre_observado_usd": df.Close.iloc[-1], "pronostico_persistencia_siguiente_cierre_usd": df.Close.iloc[-1], "nota": "Referencia ingenua; no es recomendación ni pronóstico fiable"}]).to_csv(out / "referencia_siguiente_cierre.csv", index=False)

    estilo()
    fig, ax = plt.subplots(figsize=(12, 4.8), constrained_layout=True)
    df.Close.plot(ax=ax, color="#4cc9a6", lw=1.2, label="Cierre observado")
    ax.axvline(test.index[0], color="#f0a35b", ls="--", label="Inicio test (último 20%)")
    ax.set_title("Serie de tiempo XMR/USD · división cronológica sin barajar")
    ax.set_ylabel("USD"); ax.grid(alpha=.3); ax.legend()
    fig.savefig(out / "serie_y_corte_temporal.png", dpi=160); plt.close(fig)
    print(results.to_string(index=False))
    print(f"Backtest generado en {out}")


if __name__ == "__main__":
    main()
