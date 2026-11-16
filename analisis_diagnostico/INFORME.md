# Análisis diagnóstico: explicaciones y relaciones

## Pregunta

¿Qué otras variables se mueven junto con los hallazgos descriptivos? El CSV solo
contiene precio OHLC, volumen reportado y dos columnas de dividendos/splits
constantes en cero. No tiene noticias, sentimiento, liquidez, transacciones ni
variables macroeconómicas. Por tanto el diagnóstico identifica asociaciones
internas; no puede establecer las causas del mercado.

## Resultados

- La correlación de rangos entre `|retorno diario|` y `log(1 + volumen)` fue
  Spearman ρ = 0,249 (p < 0,001). La transformación logarítmica reduce la
  influencia de volúmenes enormes. La asociación positiva es compatible con
  que días de más actividad coincidan con movimientos mayores, pero no prueba
  que el volumen cause volatilidad ni anticipa su dirección.
- El decil de volumen más alto tuvo un retorno absoluto medio de 5,10%, frente
  a 2,92% para el resto. Se usa Mann–Whitney como contraste de distribución;
  además del p-valor, importan la diferencia de magnitud y los sesgos de fuente.
- El ANOVA por día de semana dio p = 0,037 y Kruskal–Wallis p = 0,007, ambos
  sin ajuste por comparaciones. Hay evidencia de alguna diferencia en las
  distribuciones por día, pero los promedios están muy cerca de cero frente a
  la dispersión diaria. Se considera una señal exploratoria de baja magnitud,
  no una pauta para operar.
- No se detectó diferencia mensual en retorno (ANOVA p = 0,855); no se sostiene
  la hipótesis de efecto mensual con este análisis.

## Lectura para los cuatro hallazgos

1. La subida acumulada del precio describe el pasado; el calendario no explica
   esa tendencia. Faltan variables de contexto externo y controles por régimen.
2. La variabilidad extrema es coherente con un mercado de alta dispersión. El
   volumen se asocia con la magnitud del movimiento y justifica monitorizarlo,
   pero falta validación causal y fuera de muestra.
3. Los promedios de retorno por día de semana son pequeños y pueden surgir por
   azar, selección o dependencia temporal; no se propone una causa semanal.
4. Los promedios por mes no muestran evidencia suficiente de estacionalidad;
   diferencias puntuales no se deben presentar como explicaciones.

## Limitaciones

El nivel de significancia no mide importancia económica. ANOVA supone grupos
independientes con condiciones que los retornos financieros pueden incumplir.
El precio y volumen vienen de una sola fuente agregada y no se enlazan con datos
externos. Las pruebas son exploratorias, no se corrigieron por multiplicidad y
no constituyen inferencia causal. `ejecutar.py` genera los contrastes de forma
reproducible y la figura `resultados/volumen_vs_movimiento.png`.
