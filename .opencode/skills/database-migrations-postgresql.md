# S-10 · Bases de datos y migraciones (PostgreSQL)

## Cuándo usarla
Al diseñar el esquema de base de datos y gestionar cambios en la estructura.

## Herramientas
- **PostgreSQL**: Base de datos relacional
- **SQLAlchemy 2.0**: ORM
- **Alembic**: Migraciones de base de datos

## Receta

### Esquema
- Definir en documentación (diagrama ER)
- Restricciones `UNIQUE (asset_id, source_id, trade_date)`
- JSONB para hiperparámetros (flexibilidad)
- Índices por fecha para consultas temporales

### Migraciones
- Versionadas con Alembic
- Cada migración con upgrade y rollback
- Tests de integración contra PostgreSQL real
- **No usar SQLite** para tests (por diferencias en JSONB)

### Modelos SQLAlchemy
```python
from sqlalchemy import Column, Integer, String, DateTime, Numeric, JSONB
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class OHLCV(Base):
    __tablename__ = "ohlcv"
    
    id = Column(Integer, primary_key=True)
    asset_id = Column(String, nullable=False)
    source_id = Column(String, nullable=False)
    trade_date = Column(DateTime, nullable=False)
    open = Column(Numeric)
    high = Column(Numeric)
    low = Column(Numeric)
    close = Column(Numeric)
    volume = Column(Numeric)
    
    __table_args__ = (
        UniqueConstraint('asset_id', 'source_id', 'trade_date'),
    )
```

## Errores típicos
- ❌ No usar restricciones UNIQUE (datos duplicados)
- ❌ No crear índices por fecha (consultas lentas)
- ❌ Usar SQLite para tests de integración
- ❌ Migraciones sin rollback
- ❌ No versionar el esquema en documentación

## Checklist
- [ ] Esquema definido en documentación
- [ ] Restricciones UNIQUE implementadas
- [ ] Índices por fecha creados
- [ ] Migraciones con Alembic configuradas
- [ ] Tests de integración contra PostgreSQL real
- [ ] JSONB para hiperparámetros
