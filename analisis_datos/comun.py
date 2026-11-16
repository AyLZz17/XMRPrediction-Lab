"""Helpers compartidos para el estudio académico XMR/USD."""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "analisis_datos" / "xmr_usd_diario.csv"


def cargar_datos() -> pd.DataFrame:
    df = pd.read_csv(DATA, parse_dates=["Date"])
    df = df.sort_values("Date").drop_duplicates("Date").set_index("Date")
    df.index = pd.to_datetime(df.index, utc=True)
    df["retorno_pct"] = df["Close"].pct_change() * 100
    df["retorno_abs_pct"] = df["retorno_pct"].abs()
    df["rango_pct"] = (df["High"] - df["Low"]) / df["Close"] * 100
    df["dia_semana"] = df.index.day_name()
    df["mes"] = df.index.month_name()
    df["anio"] = df.index.year
    return df


def estilo():
    plt.rcParams.update({
        "figure.facecolor": "#10171c", "axes.facecolor": "#10171c",
        "axes.edgecolor": "#33424b", "axes.labelcolor": "#c9d5d8",
        "xtick.color": "#a8b8bd", "ytick.color": "#a8b8bd",
        "text.color": "#e7eff0", "grid.color": "#29383f",
        "font.size": 10,
    })


def preparar_salida(carpeta: Path) -> Path:
    salida = carpeta / "resultados"
    salida.mkdir(parents=True, exist_ok=True)
    return salida
