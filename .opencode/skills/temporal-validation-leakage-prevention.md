# S-03 · Validación temporal y prevención de fugas

## Cuándo usarla
Siempre que se particione, escale o cree ventanas de datos para modelos de series de tiempo.

## Herramientas
- **scikit-learn**: `TimeSeriesSplit`
- Tests propios de validación temporal

## Receta
1. **Cortar cronológicamente** (train/val/test) **antes** de escalar
2. `MinMaxScaler.fit(train)`; `transform` en val/test
3. Asignar cada muestra al subconjunto de la **fecha de su objetivo**:
   - La ventana de entrada puede alcanzar días previos
   - **Nunca** el objetivo ni el futuro
4. Escribir tests automatizados:
   - `max(train.index) < min(val.index) < min(test.index)`
   - Scaler entrenado solo con train
   - Ninguna feature depende de t+1

## Errores típicos
- ❌ Escalar todo el dataset antes de cortar (fuga de estadísticas)
- ❌ Ventanas que cruzan la frontera train/test
- ❌ Usar test para *early stopping*
- ❌ Asignar muestras por fecha de inicio de ventana en vez de fecha de objetivo

## Checklist
- [ ] Partición cronológica train/val/test
- [ ] Scaler ajustado solo con datos de train
- [ ] Tests de no-fuga implementados
- [ ] Sin datos de val/test en el entrenamiento
