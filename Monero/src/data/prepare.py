import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from src.config import DATA_RAW_DIR, DATA_PROCESSED_DIR, WINDOW_SIZE, TRAIN_SPLIT


def crear_ventanas(dataset, window_size):
    """
    Crea ventanas deslizantes (muestras, ventana) y el objetivo del dia siguiente.
    """
    X, y = [], []
    for i in range(window_size, len(dataset)):
        X.append(dataset[i - window_size:i, 0])
        y.append(dataset[i, 0])
    return np.array(X), np.array(y)


def preparar_datos():
    """
    Lee el CSV bruto de Monero, limpia, escala, crea las ventanas de precio y de
    retorno logaritmico, y exporta un unico dataset.npz con el split congelado.

    Invariante clave: y_test_real, base_precio, ret_test_real y test_dates estan
    alineados 1:1 con X_test (mismo numero de filas y mismo dia objetivo).
    """
    archivo_csv = os.path.join(DATA_RAW_DIR, "xmr_usd_diario.csv")
    os.makedirs(DATA_PROCESSED_DIR, exist_ok=True)
    archivo_npz = os.path.join(DATA_PROCESSED_DIR, "dataset.npz")

    if not os.path.exists(archivo_csv):
        raise FileNotFoundError(
            f"No se encontro el archivo CSV en {archivo_csv}. Ejecuta primero download.py"
        )

    print("Leyendo datos crudos desde el CSV...")
    df = pd.read_csv(archivo_csv)

    if "Date" not in df.columns or "Close" not in df.columns:
        raise ValueError("El CSV debe tener las columnas 'Date' y 'Close'.")

    df["Date"] = pd.to_datetime(df["Date"], utc=True).dt.tz_localize(None)
    df = df.dropna(subset=["Close"]).sort_values("Date").reset_index(drop=True)

    fechas = df["Date"].dt.strftime("%Y-%m-%d").to_numpy()
    precios = df["Close"].to_numpy(dtype="float64").reshape(-1, 1)

    print(f"Total de registros limpios a procesar: {len(precios)}")

    # Retorno logaritmico diario: r_t = ln(close_t / close_{t-1})
    retornos = np.zeros_like(precios)
    retornos[1:, 0] = np.log(precios[1:, 0] / precios[:-1, 0])

    # 3. Division estricta Train/Test (cronologica, sin shuffle)
    split_idx = int(len(precios) * TRAIN_SPLIT)

    # 4. Escalado ajustado UNICAMENTE con el conjunto de entrenamiento
    scaler = MinMaxScaler(feature_range=(0, 1)).fit(precios[:split_idx])
    ret_scaler = MinMaxScaler(feature_range=(0, 1)).fit(retornos[1:split_idx])

    precios_esc = scaler.transform(precios)
    retornos_esc = ret_scaler.transform(retornos)

    # 5. Ventanas: X contiene el pasado, y el objetivo del dia siguiente
    X, y = crear_ventanas(precios_esc, WINDOW_SIZE)
    Xr, r = crear_ventanas(retornos_esc, WINDOW_SIZE)

    # Forma 3D que exigen las redes: (muestras, tiempo, caracteristicas)
    X = X.reshape(X.shape[0], X.shape[1], 1)
    Xr = Xr.reshape(Xr.shape[0], Xr.shape[1], 1)

    # Numero de muestras cuyo objetivo cae dentro del train
    n_train = split_idx - WINDOW_SIZE

    X_train, X_test = X[:n_train], X[n_train:]
    y_train, y_test = y[:n_train], y[n_train:]
    Xret_train, Xret_test = Xr[:n_train], Xr[n_train:]
    r_train, r_test = r[:n_train], r[n_train:]

    # 6. Valores reales del test, alineados con cada ventana de X_test
    y_test_real = precios[split_idx:]
    ret_test_real = retornos[split_idx:]
    test_dates = fechas[split_idx:]
    # Precio de cierre del dia anterior al objetivo (base para reconstruir retornos)
    base_precio = precios[split_idx - 1:-1]

    # 7. Validacion del contrato de alineacion (falla rapido si algo se desfasa)
    n_test = len(X_test)
    for nombre, arr in [
        ("y_test", y_test),
        ("y_test_real", y_test_real),
        ("Xret_test", Xret_test),
        ("r_test", r_test),
        ("ret_test_real", ret_test_real),
        ("test_dates", test_dates),
        ("base_precio", base_precio),
    ]:
        if len(arr) != n_test:
            raise ValueError(
                f"Desalineacion detectada: {nombre} tiene {len(arr)} filas y X_test {n_test}."
            )

    # El retorno logaritmico debe reconstruir exactamente el precio real
    reconstruido = base_precio * np.exp(ret_test_real)
    if not np.allclose(reconstruido, y_test_real, rtol=1e-6, atol=1e-4):
        raise ValueError("El retorno logaritmico no reconstruye el precio real del test.")

    archivo_temporal = f"{archivo_npz}.tmp"
    try:
        with open(archivo_temporal, "wb") as file:
            np.savez(
                file,
                X_train=X_train,
                y_train=y_train,
                X_test=X_test,
                y_test=y_test,
                y_test_real=y_test_real,
                Xret_train=Xret_train,
                r_train=r_train,
                Xret_test=Xret_test,
                r_test=r_test,
                ret_test_real=ret_test_real,
                base_precio=base_precio,
                test_dates=test_dates,
                scaler=scaler,
                ret_scaler=ret_scaler,
                scaler_min=scaler.data_min_,
                scaler_max=scaler.data_max_,
            )
            file.flush()
            os.fsync(file.fileno())
        os.replace(archivo_temporal, archivo_npz)
    finally:
        if os.path.exists(archivo_temporal):
            os.remove(archivo_temporal)

    print(f"Datos preparados y guardados con exito en: {archivo_npz}")
    print(f"Train: {len(X_train)} muestras | Test: {n_test} muestras")
    print(f"Forma de X_train: {X_train.shape}, y_train: {y_train.shape}")
    print(f"Forma de X_test:  {X_test.shape},  y_test_real: {y_test_real.shape}")
    print(f"Rango de fechas test: {test_dates[0]} -> {test_dates[-1]}")


if __name__ == "__main__":
    preparar_datos()
