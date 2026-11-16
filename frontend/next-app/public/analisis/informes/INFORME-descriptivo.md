# Análisis descriptivo (EDA)

## Alcance

Se usaron 3.278 observaciones OHLCV diarias de XMR/USD entre el 9 de noviembre
de 2017 y el 31 de octubre de 2026. El retorno simple diario se calculó como
`100 × (cierre_t / cierre_(t-1) − 1)`. Día de semana y mes son categorías
derivadas de la fecha UTC, no columnas entregadas por la fuente.

## Hallazgos numéricos

1. El cierre creció de 120,78 USD en la primera fila a 598,60 USD en la última,
   un cambio de +395,61% en todo el periodo. La serie contiene varias fases,
   por lo que este cambio acumulado no describe una trayectoria uniforme ni
   garantiza continuidad futura.
2. La desviación estándar del retorno diario fue 4,68%; el percentil 95 del
   retorno absoluto fue 9,65%. El retorno absoluto máximo fue −41,39% el
   19 de mayo de 2021. Esto documenta variabilidad elevada y eventos extremos.

## Hallazgos categóricos

3. El promedio del retorno cambia según el día de semana: de −0,27% el jueves a
   +0,54% el sábado. La diferencia es pequeña en comparación con una desviación
   estándar diaria de alrededor de 4–5 puntos porcentuales; es descriptiva,
   no una regla operativa.
4. Por mes calendario, el retorno medio observado oscila entre −0,24% en junio
   y +0,66% en abril. La dispersión dentro de cada mes es mucho mayor que esta
   diferencia entre promedios, así que no se afirma una estacionalidad mensual.

## Artefactos

`ejecutar.py` crea tablas CSV y dos figuras en `resultados/`. Las categorías se
usan para organizar la comparación; no deben interpretarse como causas.
Consulte `../analisis_diagnostico/INFORME.md` para las asociaciones y pruebas.
