import os
import pandas as pd
import yfinance as yf
from src.config import DATA_RAW_DIR, TICKER

def descargar_datos_xmr():
    """
    Descarga el histórico diario de Monero (XMR-USD) usando yfinance
    y lo guarda en la carpeta data/raw/ sin alterar los datos originales.
    """
    # 1. Asegurar de que la carpeta de destino exista
    os.makedirs(DATA_RAW_DIR, exist_ok=True)
    
    # 2. Definir la ruta final del archivo CSV
    archivo_csv = os.path.join(DATA_RAW_DIR, "xmr_usd_diario.csv")
    
    print(f"Descargando datos de {TICKER} desde Yahoo Finance...")
    
    # 3. Descargar histórico completo (intervalo diario)
    # history(period="max") trae toda la historia disponible de Monero
    df = yf.Ticker(TICKER).history(period="max", interval="1d")
    
    if df.empty:
        raise ValueError(f"No se pudieron descargar datos para el ticker {TICKER}. Revisa tu conexión a internet.")

    # 4. Limpiar índices o columnas si es necesario (yfinance a veces guarda información extra)
    df.reset_index(inplace=True)

    # Reemplazar el archivo completo evita que los lectores vean un CSV parcial.
    archivo_temporal = f"{archivo_csv}.tmp"
    try:
        df.to_csv(archivo_temporal, index=False)
        os.replace(archivo_temporal, archivo_csv)
    finally:
        if os.path.exists(archivo_temporal):
            os.remove(archivo_temporal)
    
    print(f"¡Éxito! Archivo guardado en: {archivo_csv}")
    print(f"Total de registros (filas) descargados: {len(df)}")

if __name__ == "__main__":
    descargar_datos_xmr()