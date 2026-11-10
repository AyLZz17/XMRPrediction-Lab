# S-06 · Evaluación, métricas y comparación

## Cuándo usarla
Al cerrar una corrida de entrenamiento y al comparar modelos entre sí.

## Herramientas
- **scikit-learn metrics**: Funciones de evaluación
- **NumPy**: Cálculos numéricos
- **Diebold–Mariano** (opcional): Prueba estadística de comparación de pronósticos

## Receta

### Métricas de regresión (en USD, tras des-escalar)
- **MAE** = (1/n)Σ|yₜ−ŷₜ|
- **RMSE** = √[(1/n)Σ(yₜ−ŷₜ)²]
- **MAPE** = (100%/n)Σ|(yₜ−ŷₜ)/yₜ|

### Métricas de clasificación (dirección)
- Proporción de aciertos (accuracy)
- Matriz de confusión
- F1-score

### Dirección derivada del modelo de regresión
- `sign(ŷₜ₊₁ − yₜ)`
- Comparar con el clasificador dedicado

### Comparación
- Misma serie de test para todos los modelos
- Tabla final + gráfico real vs. predicho
- Incluir siempre los baselines junto al modelo complejo

## Errores típicos
- ❌ Comparar métricas calculadas sobre escalas distintas
- ❌ Elegir el "mejor" modelo por el test (sobreajuste al test)
- ❌ No mostrar los baselines en la comparación
- ❌ Usar métricas inapropiadas para el problema (ej. accuracy en datos desbalanceados)

## Checklist
- [ ] Métricas calculadas en escala original (des-escaladas)
- [ ] Misma partición de test para todos los modelos
- [ ] Tabla comparativa con todos los modelos
- [ ] Gráfico real vs. predicho generado
- [ ] Baselines incluidos en la comparación
