"""Contrasta asociaciones exploratorias del EDA sin atribuir causalidad."""
from pathlib import Path
import sys

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "analisis_datos"))
from comun import cargar_datos, estilo, preparar_salida


def main():
    df = cargar_datos().dropna(subset=["retorno_pct"]).copy()
    out = preparar_salida(Path(__file__).resolve().parent)
    week = [g.retorno_pct.values for _, g in df.groupby("dia_semana")]
    month = [g.retorno_pct.values for _, g in df.groupby("mes")]
    week_anova = stats.f_oneway(*week)
    month_anova = stats.f_oneway(*month)
    week_kruskal = stats.kruskal(*week)
    month_kruskal = stats.kruskal(*month)
    rho, rho_p = stats.spearmanr(df.retorno_abs_pct, np.log1p(df.Volume))
    cut = df.Volume.quantile(.90)
    high = df.loc[df.Volume >= cut, "retorno_abs_pct"]
    rest = df.loc[df.Volume < cut, "retorno_abs_pct"]
    mw = stats.mannwhitneyu(high, rest, alternative="two-sided")
    rows = [
        {"relacion": "retorno_por_dia_semana", "prueba": "ANOVA one-way", "estadistico": week_anova.statistic, "p_valor": week_anova.pvalue, "n": len(df)},
        {"relacion": "retorno_por_mes", "prueba": "ANOVA one-way", "estadistico": month_anova.statistic, "p_valor": month_anova.pvalue, "n": len(df)},
        {"relacion": "retorno_por_dia_semana", "prueba": "Kruskal-Wallis", "estadistico": week_kruskal.statistic, "p_valor": week_kruskal.pvalue, "n": len(df)},
        {"relacion": "retorno_por_mes", "prueba": "Kruskal-Wallis", "estadistico": month_kruskal.statistic, "p_valor": month_kruskal.pvalue, "n": len(df)},
        {"relacion": "retorno_absoluto_vs_log_volumen", "prueba": "Spearman", "estadistico": rho, "p_valor": rho_p, "n": len(df)},
        {"relacion": "retorno_absoluto_decil_superior_volumen_vs_resto", "prueba": "Mann-Whitney U", "estadistico": mw.statistic, "p_valor": mw.pvalue, "n": len(df)},
    ]
    pd.DataFrame(rows).to_csv(out / "pruebas_asociacion.csv", index=False)
    pd.DataFrame([
        {"grupo": "decil_superior_volumen", "umbral_volumen": cut, "n": len(high), "media_retorno_absoluto_pct": high.mean(), "mediana_retorno_absoluto_pct": high.median()},
        {"grupo": "resto", "umbral_volumen": cut, "n": len(rest), "media_retorno_absoluto_pct": rest.mean(), "mediana_retorno_absoluto_pct": rest.median()},
    ]).to_csv(out / "volumen_y_movimiento.csv", index=False)
    estilo()
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.8), constrained_layout=True)
    x = np.log1p(df.Volume)
    bins = pd.qcut(x, q=20, duplicates="drop")
    grouped = df.assign(log_volumen=x, banda=bins).groupby("banda", observed=True).agg(
        log_volumen=("log_volumen", "mean"), movimiento_abs_pct=("retorno_abs_pct", "mean")
    )
    axes[0].scatter(x, df.retorno_abs_pct, s=8, alpha=.12, color="#72a7ff", edgecolors="none")
    axes[0].plot(grouped.log_volumen, grouped.movimiento_abs_pct, color="#f0a35b", lw=2, marker="o", ms=3)
    axes[0].set_title("Volumen y magnitud del retorno")
    axes[0].set_xlabel("log(1 + volumen reportado)")
    axes[0].set_ylabel("Retorno absoluto (%)")
    axes[1].boxplot([rest, high], tick_labels=["Otros días", "Decil superior"], showfliers=False,
                    patch_artist=True, boxprops={"facecolor": "#1b1b1f", "color": "#72a7ff"},
                    medianprops={"color": "#f0a35b", "linewidth": 2},
                    whiskerprops={"color": "#8d898d"}, capprops={"color": "#8d898d"})
    axes[1].set_title("Distribución de |retorno| por grupo de volumen")
    axes[1].set_ylabel("Retorno absoluto (%)")
    for ax in axes:
        ax.grid(axis="y", alpha=.3)
    fig.suptitle("Diagnóstico exploratorio · asociación, no causalidad", fontsize=14)
    fig.savefig(out / "volumen_vs_movimiento.png", dpi=160)
    plt.close(fig)
    print(f"Asociaciones calculadas en {out}")
    print(f"rho(abs(retorno), log1p(volumen))={rho:.3f}; p={rho_p:.3g}")
    print(f"ANOVA día p={week_anova.pvalue:.3g}; mes p={month_anova.pvalue:.3g}")


if __name__ == "__main__":
    main()
