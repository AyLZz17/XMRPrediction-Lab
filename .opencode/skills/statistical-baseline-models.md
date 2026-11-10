# S-04 · Modelos estadísticos base

## Cuándo usarla
Entrenar y evaluar los baselines (líneas base) para comparar contra modelos más complejos.

## Herramientas
- **scikit-learn**: `LinearRegression`
- **statsmodels**: `ARIMA`
- **pmdarima** (opcional): `auto_arima`

## Receta

### Media móvil
- ŷₜ₊₁ = media de los últimos k cierres
- k elegido en validación (p. ej. 5, 7, 14, 30)

### Regresión lineal
- Entrada = ventana aplanada (mismos 30 días que el LSTM)
- Salida = cierre t+1

### ARIMA
- Orden (p,d,q) elegido en train (AIC o `auto_arima`)
- Pronóstico **de un paso adelante en modo rodante** sobre test
- Incorporar cada observación real sin reestimar (`results.append(..., refit=False)`)
- Para que sea comparable con el LSTM

### Persistencia
- ŷₜ₊₁ = yₜ (modelo más simple posible)

## Errores típicos
- ❌ Pronóstico multi-paso de ARIMA comparado contra un LSTM de un paso
- ❌ Seleccionar (p,d,q) mirando el test
- ❌ No usar el mismo conjunto de test para todos los modelos
- ❌ Olvidar el modelo de persistencia como baseline mínimo

## Checklist
- [ ] Baseline de persistencia implementado
- [ ] Media móvil con k optimizado en validación
- [ ] Regresión lineal con ventana aplanada
- [ ] ARIMA en modo rodante de un paso
- [ ] Todos evaluados en el mismo test set
