# S-01 · Ingeniería de datos de series de tiempo

## Cuándo usarla
Al ingerir o limpiar datos OHLCV (Open, High, Low, Close, Volume) diarios de criptomonedas o cualquier serie de tiempo financiera.

## Herramientas
- **pandas**: Manipulación y análisis de datos
- **NumPy**: Operaciones numéricas
- **yfinance** o CSV: Descarga de datos de mercado
- **pandera** (opcional): Validación de esquema

## Receta
1. Descargar y guardar **snapshot crudo** con checksum (SHA-256) y fecha de descarga
2. Crear `DatetimeIndex` ordenado, sin duplicados, zona horaria UTC
3. Detectar huecos de fechas y valores nulos; **documentar** el tratamiento:
   - Interpolar solo con datos pasados o eliminar
   - **Nunca** rellenar con datos del futuro
4. Validar integridad:
   - `high ≥ max(open, close)`
   - `low ≤ min(open, close)`
   - `volume ≥ 0`
   - Precios > 0

## Errores típicos
- ❌ Interpolación bidireccional (causa fuga de datos)
- ❌ Mezclar husos horarios sin normalizar a UTC
- ❌ Sobrescribir el snapshot original sin backup
- ❌ No documentar el tratamiento de valores nulos

## Checklist
- [ ] Snapshot crudo con checksum SHA-256
- [ ] Índice temporal ordenado y sin duplicados
- [ ] Zona horaria UTC normalizada
- [ ] Validaciones de integridad OHLCV ejecutadas
- [ ] Tratamiento de nulos documentado
