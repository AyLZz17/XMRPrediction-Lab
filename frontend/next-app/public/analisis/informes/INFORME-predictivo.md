# Análisis predictivo con series de tiempo

## Protocolo

Se ordenó por fecha UTC y se reservó el último 20% (656 observaciones) como
prueba, sin barajar. Se compararon referencias simples: persistencia y media
móvil para cierre, media móvil de siete observaciones para rango porcentual y
volumen logarítmico, media expansiva por día de semana para retornos diarios,
y media histórica por mes calendario para retornos mensuales. Toda predicción
usa solo datos previos a la fecha objetivo. Las categorías de calendario son
predictores auxiliares; sus perfiles son ruidosos.

## Resultados de backtest

| Hallazgo / serie | MAE | RMSE | Observaciones |
|---|---:|---:|---:|
| Cierre diario, persistencia | 9,685 USD | 15,035 USD | 656 |
| Cierre diario, media móvil 7 | 15,197 USD | 25,017 USD | 656 |
| Rango diario porcentual, media móvil 7 | 2,247 puntos porcentuales | 3,550 | 656 |
| Log(1 + volumen), media móvil 7 | 0,201 | 0,279 | 656 |
| Retorno diario, media histórica del día | 2,662 puntos porcentuales | 3,789 | 656 |
| Retorno mensual, media de mismo mes calendario | 0,429 puntos porcentuales | 0,545 | 22 |
| Retorno mensual, media expansiva global | 0,426 puntos porcentuales | 0,517 | 22 |

La categoría de mes no mejoró la referencia global en este backtest corto. Los
promedios por día y mes no entregan una señal predictiva útil por sí solos.
La referencia ingenua de próximo cierre se guarda en
`resultados/referencia_siguiente_cierre.csv`; no incluye intervalo de confianza
y no debe usarse como señal de compra o venta.

## Relación con el benchmark del servicio

El repositorio ya contiene un benchmark de modelos con un protocolo congelado
en su propio pipeline: 656 días comunes de prueba y resultados publicados en
`backend/services/ml-service/README.md`. Allí, persistencia tiene MAE 9,69 USD,
LSTM 9,99 USD, GRU 10,11 USD, ARIMA 9,94 USD y media móvil 15,20 USD. Este
backtest independiente reproduce las referencias de persistencia (9,69 USD) y
media móvil (15,20 USD) sobre las mismas 656 fechas. No se tocó el servicio ML.

## Lectura de los cuatro hallazgos

1. La trayectoria alcista acumulada no implica que la tendencia continúe; la
   persistencia es un punto de referencia fuerte para el cierre diario.
2. El rango diario y volumen presentan fluctuación; el MA7 resume historia, no
   captura todos los saltos, y su error debe acompañarse de bandas de riesgo.
3. La diferencia observada por día de semana no se convierte automáticamente
   en una predicción del próximo retorno; el promedio expansivo tiene error
   absoluto medio de 2,66 puntos porcentuales.
4. El mes calendario no mejoró el pronóstico mensual global. No hay evidencia
   predictiva suficiente para asignar comportamiento futuro por mes.

## Limitaciones

Solo se evaluaron referencias transparentes; el corte temporal no se reajustó
ni se optimizaron hiperparámetros. Un único holdout no mide estabilidad ante
cambios de régimen. Las métricas de retorno no equivalen a rentabilidad de una
estrategia (faltan costos, ejecución y gestión de riesgo). Los pronósticos son
experimentales, no asesoría financiera.
