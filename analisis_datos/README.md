# Datos compartidos del análisis

`xmr_usd_diario.csv` es una copia de trabajo del histórico diario OHLCV de
`backend/services/ml-service/data/raw/xmr_usd_diario.csv`. No se modifica el
original. La copia cubre 2017-11-09 a 2026-10-31 (3.278 filas) y conserva sus
columnas de origen. Los scripts de las cuatro carpetas leen esta copia y dejan
los resultados en sus respectivas subcarpetas `resultados/`.

La fila 2026-10-30 no está en el archivo y existe un solo hueco diario; las
observaciones se mantienen como fueron recibidas. Los datos son diarios, por lo
que no permiten análisis intradía. Volumen es el reportado por la fuente y no
se interpreta como volumen de un mercado único.

## Ejecución

Desde la raíz del repositorio, con Python 3.11 o superior:

```powershell
python -m pip install -r analisis_datos/requirements.txt
python analisis_descriptivo/ejecutar.py
python analisis_diagnostico/ejecutar.py
python analisis_predictivo/ejecutar.py
python analisis_prescriptivo/ejecutar.py
```

Se recomienda crear un entorno virtual antes de instalar dependencias.
