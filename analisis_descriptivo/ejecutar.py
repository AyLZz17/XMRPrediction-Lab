"""EDA reproducible: estadística descriptiva y cuatro hallazgos iniciales."""
from pathlib import Path
import sys

import matplotlib.pyplot as plt
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "analisis_datos"))
from comun import cargar_datos, estilo, preparar_salida


def main():
    df = cargar_datos()
    out = preparar_salida(Path(__file__).resolve().parent)
    estilo()
    df.describe(percentiles=[.05, .25, .5, .75, .95]).T.to_csv(out / "resumen_numerico.csv")
    df.groupby("dia_semana", sort=False)["retorno_pct"].agg(["count", "mean", "median", "std"]).to_csv(out / "retorno_por_dia_semana.csv")
    df.groupby("mes")["retorno_pct"].agg(["count", "mean", "median", "std"]).to_csv(out / "retorno_por_mes.csv")
    annual = df.groupby("anio")["Close"].agg(primero="first", ultimo="last")
    annual["cambio_pct"] = (annual.ultimo / annual.primero - 1) * 100
    annual.to_csv(out / "cierre_por_anio.csv")

    fig, axes = plt.subplots(2, 2, figsize=(13, 8), constrained_layout=True)
    df.Close.plot(ax=axes[0, 0], color="#4cc9a6", lw=1.3, title="Cierre diario XMR/USD")
    df.retorno_pct.plot(ax=axes[0, 1], color="#f0a35b", lw=.6, title="Retorno diario (%)")
    df.retorno_abs_pct.rolling(30).mean().plot(ax=axes[1, 0], color="#72a7ff", title="Promedio móvil 30 días · |retorno| (%)")
    df.Volume.plot(ax=axes[1, 1], color="#bd91f4", lw=.7, title="Volumen reportado")
    for ax in axes.flat:
        ax.grid(alpha=.35)
        ax.set_xlabel("")
    fig.suptitle("EDA descriptivo · Monero XMR/USD · datos diarios", fontsize=15)
    fig.savefig(out / "resumen_eda.png", dpi=160)
    plt.close(fig)

    week = df.groupby("dia_semana").retorno_pct.mean().reindex(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
    month = df.groupby("mes").retorno_pct.mean().reindex(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"])
    fig, axes = plt.subplots(1, 2, figsize=(13, 4.2), constrained_layout=True)
    week.plot.bar(ax=axes[0], color="#4cc9a6", title="Retorno medio por día de semana")
    month.plot.bar(ax=axes[1], color="#72a7ff", title="Retorno medio por mes calendario")
    for ax in axes:
        ax.axhline(0, color="#e7eff0", lw=.8, alpha=.7)
        ax.grid(axis="y", alpha=.3)
        ax.tick_params(axis="x", rotation=35)
        ax.set_ylabel("Retorno (%)")
    fig.savefig(out / "hallazgos_calendario.png", dpi=160)
    plt.close(fig)

    print(f"EDA generado en {out}")
    print(f"Filas: {len(df)} | fechas UTC: {df.index.min().date()} a {df.index.max().date()}")
    print(f"Cambio cierre: {(df.Close.iloc[-1] / df.Close.iloc[0] - 1) * 100:.2f}%")
    print(f"Desv. estándar retorno: {df.retorno_pct.std():.2f}%")


if __name__ == "__main__":
    main()
