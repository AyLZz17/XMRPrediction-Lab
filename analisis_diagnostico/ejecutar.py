"""Contrasta asociaciones exploratorias del EDA sin atribuir causalidad."""
from pathlib import Path
import sys

import numpy as np
import pandas as pd
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "analisis_datos"))
from comun import cargar_datos, preparar_salida


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
    print(f"Asociaciones calculadas en {out}")
    print(f"rho(abs(retorno), log1p(volumen))={rho:.3f}; p={rho_p:.3g}")
    print(f"ANOVA día p={week_anova.pvalue:.3g}; mes p={month_anova.pvalue:.3g}")


if __name__ == "__main__":
    main()
