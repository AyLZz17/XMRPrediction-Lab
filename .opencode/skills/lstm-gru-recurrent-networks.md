# S-05 · Redes recurrentes LSTM/GRU

## Cuándo usarla
Entrenar el modelo principal (y su alternativa GRU) para predicción de series de tiempo.

## Herramientas
- **TensorFlow/Keras**: Framework de deep learning
- **Optuna**: Ajuste de hiperparámetros
- **MLflow**: Tracking de experimentos

## Receta (configuración inicial)

### Arquitectura
```
Entrada (30, n_features)
  → LSTM(100, return_sequences=True)
  → Dropout(0.2)
  → LSTM(100)
  → Dropout(0.2)
  → Dense(1)
```

### Entrenamiento
- Optimizador: Adam
- Tamaño de lote: 32
- Hasta 20 épocas con `EarlyStopping` sobre validación
- `restore_best_weights=True`

### Tareas
- **Regresión**: `Dense(1)` lineal, pérdida MSE (o Huber)
- **Clasificación (dirección)**: `Dense(1, sigmoid)`, pérdida binaria

### Hiperparámetros a ajustar
- Unidades: {50, 100, 150}
- Capas: {1, 2, 3}
- Dropout: {0.1, 0.2, 0.3}
- Ventana: {7, 14, 30, 60}
- Tasa de aprendizaje

### Reproducibilidad
- Repetir con ≥ 5 semillas diferentes
- Fijar semillas en: `random`, `numpy`, `tensorflow`

## Errores típicos
- ❌ Sobreajuste con pocas filas de datos
- ❌ Fijar semillas solo en NumPy y no en TensorFlow
- ❌ Precios de test fuera del rango de train con `MinMaxScaler`
- ❌ No usar `restore_best_weights=True` en EarlyStopping
- ❌ Entrenar con muy pocas épocas o sin EarlyStopping

## Checklist
- [ ] Arquitectura LSTM/GRU definida
- [ ] EarlyStopping con restore_best_weights
- [ ] Múltiples semillas para reproducibilidad
- [ ] Ajuste de hiperparámetros con Optuna
- [ ] Métricas registradas en MLflow
