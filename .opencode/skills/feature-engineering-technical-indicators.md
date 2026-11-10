# S-02 · Ingeniería de características (indicadores técnicos)

## Cuándo usarla
Al construir el *feature set* para modelos de machine learning: OHLCV, variación % diaria, medias móviles, RSI, MACD, etc.

## Herramientas
- **pandas**: Cálculos vectorizados
- **ta** o **pandas-ta**: Librerías de indicadores técnicos (verificar mantenimiento vigente)
- Implementación propia probada como alternativa

## Receta
1. Calcular indicadores con ventanas **hacia atrás** (lookback)
2. Descartar las primeras filas con NaN por calentamiento (warm-up)
3. Registrar la lista de features en YAML del experimento
4. Features comunes:
   - **Variación % diaria**: `(close_t - close_t-1) / close_t-1`
   - **Medias móviles**: SMA(7), SMA(14), SMA(30)
   - **RSI**: Relative Strength Index (14 períodos)
   - **MACD**: Moving Average Convergence Divergence
   - **Volatilidad**: Desviación estándar móvil de retornos

## Errores típicos
- ❌ `rolling(center=True)` — usa datos futuros
- ❌ `shift(-1)` en features — viola la regla de no fuga
- ❌ Usar el cierre de t+1 dentro de un indicador de t
- ❌ No descartar filas con NaN por calentamiento
- ❌ No registrar la lista de features usadas

## Checklist
- [ ] Todas las features calculadas con lookback únicamente
- [ ] Filas iniciales con NaN eliminadas
- [ ] Lista de features documentada en YAML
- [ ] Sin `shift(-1)` ni `center=True` en features
