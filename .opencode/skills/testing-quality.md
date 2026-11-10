# S-14 · Testing y calidad

## Cuándo usarla
En todo el ciclo de desarrollo para asegurar la calidad del código y del sistema.

## Herramientas
- **pytest** + **pytest-cov**: Tests unitarios y cobertura
- **httpx** (`TestClient`): Tests de API
- **Vitest**: Tests de frontend
- **ESLint**: Linting de JavaScript/TypeScript
- **ruff**: Linting de Python
- **mypy**: Type checking de Python
- **pre-commit**: Hooks de pre-commit

## Receta

### Pirámide de testing
```
        /\
       /  \  E2E (pocos)
      /----\
     /      \  Integración (algunos)
    /--------\
   /          \  Unitarios (muchos)
  /------------\
```

### Tests unitarios (muchos)
- En `ml/` (incluidas las de **no fuga**)
- Datos sintéticos
- Fuentes mockeadas
- Objetivo: cobertura ≥ 80% en `ml/`

### Tests de integración (algunos)
- API con BD de prueba (PostgreSQL real)
- Endpoints principales
- Flujos completos

### Tests E2E (pocos)
- Flujos críticos de usuario
- Con datos de prueba

### Tests de no-fuga
```python
def test_no_data_leakage():
    """Verificar que no hay fuga de datos entre train/val/test."""
    train, val, test = temporal_split(data)
    
    # Verificar orden cronológico
    assert max(train.index) < min(val.index)
    assert max(val.index) < min(test.index)
    
    # Verificar que el scaler solo vio train
    scaler = MinMaxScaler()
    scaler.fit(train)
    assert scaler.data_min_ >= train.min().min()
    assert scaler.data_max_ <= train.max().max()
```

## Errores típicos
- ❌ No tests de no-fuga
- ❌ Cobertura < 80% en `ml/`
- ❌ Usar datos reales en tests unitarios
- ❌ No mockear fuentes externas
- ❌ Tests lentos por no usar fixtures

## Checklist
- [ ] Pirámide de testing implementada
- [ ] Tests de no-fuga en `ml/`
- [ ] Cobertura ≥ 80% en `ml/`
- [ ] Tests de API con BD de prueba
- [ ] Tests E2E para flujos críticos
- [ ] Linting y type checking en CI
- [ ] Pre-commit hooks configurados
