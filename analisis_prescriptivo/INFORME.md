# Análisis prescriptivo: decisiones responsables

La prescripción parte de cuatro hallazgos, pero no convierte las asociaciones
observadas en órdenes automáticas. El objetivo es proponer acciones de
investigación, monitoreo y gestión de incertidumbre que puedan evaluarse.

| Evidencia | Acción propuesta | Indicador de seguimiento | Condición para revisar |
|---|---|---|---|
| Cierre acumuló +395,6%, con trayectoria por fases | Mostrar niveles junto con retornos y ventanas de riesgo; mantener persistencia como baseline | MAE/RMSE en ventana móvil | Reentrenar o sustituir solo si la mejora sobre persistencia es estable fuera de muestra |
| Desv. estándar del retorno 4,68%; p95 de `|retorno|` 9,65% | Alertar para revisión humana cuando un retorno absoluto diario exceda 9,65%; validar calidad del registro | Frecuencia de alertas y tasa de datos corregidos | Recalibrar umbral con ventana móvil y revisión de quiebres de régimen |
| Decil superior de volumen coincide con retorno absoluto medio 5,10% vs. 2,92% | Añadir volumen como contexto de alerta, nunca como dirección de precio | Asociación móvil volumen–movimiento | Desactivar la regla si la asociación cae o cambia de signo en ventanas posteriores |
| Retorno semanal difiere poco; evidencia exploratoria; no hay efecto mensual claro | No programar operación por día/mes; acumular más historia y repetir el análisis con corrección por pruebas múltiples | Diferencia de retorno y estabilidad por periodo | Considerar un efecto calendario solo tras replicación independiente |

## Secuencia recomendada

1. Mantener el benchmark actual reproducible y reportar MAE, RMSE y error de
   dirección en el mismo conjunto de fechas.
2. Agregar un backtest de origen rodante que repita la comparación en varias
   ventanas y mida sensibilidad a cambios de régimen.
3. Incorporar contexto externo con fuente, timestamp y licencia verificables
   antes de afirmar causas (por ejemplo, noticias o condiciones de mercado).
4. Presentar en la interfaz la incertidumbre y explicar cuándo los datos están
   incompletos; no generar velas intradía desde este CSV diario.
5. Si se explora una estrategia, simular primero costos, deslizamiento, riesgo
   y controles de pérdidas en un entorno de investigación; no ejecutar órdenes
   automáticamente a partir de este estudio.

Estas recomendaciones son de diseño analítico, no asesoría financiera.
