# S-08 · Reproducibilidad y tracking

## Cuándo usarla
En cada experimento de machine learning para asegurar reproducibilidad y trazabilidad.

## Herramientas
- **MLflow**: Tracking de experimentos y modelos
- **YAML**: Configuración de experimentos
- **joblib**: Serialización de modelos
- **Semillas**: `random`, `numpy`, `tensorflow`
- **Lockfile**: Dependencias fijadas

## Receta

### Registrar en cada corrida
- Dataset (checksum SHA-256)
- Lista de features
- Split (train/val/test)
- Hiperparámetros
- Semilla(s)
- Métricas por subconjunto
- Curvas de aprendizaje
- Artefactos (modelos, gráficos)

### Reproducibilidad
- Un experimento se puede reproducir con `make experiment CONFIG=...`
- Todas las dependencias fijadas en lockfile
- Semillas documentadas y fijadas

### Estructura de configuración
```yaml
# config/experiment.yaml
dataset:
  source: "xmr_daily"
  checksum: "sha256:..."
features:
  - close
  - volume
  - sma_7
  - rsi_14
split:
  train: "2020-01-01/2022-12-31"
  val: "2023-01-01/2023-06-30"
  test: "2023-07-01/2023-12-31"
model:
  type: "lstm"
  params:
    units: 100
    layers: 2
    dropout: 0.2
training:
  epochs: 20
  batch_size: 32
  seed: 42
```

## Errores típicos
- ❌ No registrar el checksum del dataset
- ❌ No fijar semillas en todas las librerías
- ❌ No guardar los hiperparámetros usados
- ❌ No registrar métricas por subconjunto (train/val/test)
- ❌ Dependencias no fijadas (requirements.txt sin versiones)

## Checklist
- [ ] MLflow configurado y corriendo
- [ ] Checksum del dataset registrado
- [ ] Features documentadas en YAML
- [ ] Hiperparámetros guardados
- [ ] Semillas fijadas y registradas
- [ ] Métricas por subconjunto registradas
- [ ] Dependencias fijadas en lockfile
