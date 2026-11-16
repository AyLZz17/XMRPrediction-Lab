"""Produce la matriz de acciones trazable a resultados del estudio."""
from pathlib import Path
import pandas as pd


def main():
    base = Path(__file__).resolve().parent
    resultados = base / "resultados"
    resultados.mkdir(exist_ok=True)
    acciones = [
        {"hallazgo": "Tendencia acumulada del cierre", "evidencia": "+395.61% periodo completo; persistencia MAE=9.70 USD", "accion": "Mantener persistencia como baseline; exigir mejora estable fuera de muestra", "indicador": "MAE/RMSE en ventanas móviles", "limite": "Cambio histórico no garantiza tendencia futura"},
        {"hallazgo": "Riesgo y días extremos", "evidencia": "Desv. estándar retorno=4.68%; p95 |retorno|=9.65%", "accion": "Alerta de revisión humana al exceder p95; comprobar fuente y fecha", "indicador": "Frecuencia de alertas y calidad del dato", "limite": "El umbral se recalibra ante cambios de régimen"},
        {"hallazgo": "Volumen y magnitud del movimiento", "evidencia": "ρ Spearman=0.249; top decil |retorno| medio=5.10%", "accion": "Usar volumen como contexto de volatilidad, nunca como señal direccional", "indicador": "Asociación móvil volumen-movimiento", "limite": "Asociación exploratoria, sin inferencia causal"},
        {"hallazgo": "Categorías calendario", "evidencia": "ANOVA weekday p=0.037 sin ajuste; mes p=0.855", "accion": "No automatizar decisiones por calendario; replicar con ajuste múltiple", "indicador": "Magnitud y estabilidad entre periodos", "limite": "Diferencias pequeñas e inestables"},
    ]
    pd.DataFrame(acciones).to_csv(resultados / "matriz_acciones.csv", index=False)
    print(f"Matriz de acciones: {resultados / 'matriz_acciones.csv'}")


if __name__ == "__main__":
    main()
