import numpy as np


def mae(y_true, y_pred):
    """Calcula el Error Absoluto Medio (MAE)."""
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    return float(np.mean(np.abs(y_true - y_pred)))


def rmse(y_true, y_pred):
    """Calcula la Raiz del Error Cuadratico Medio (RMSE)."""
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def mape(y_true, y_pred):
    """Calcula el Error Porcentual Absoluto Medio (MAPE) en porcentaje."""
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    mask = y_true != 0
    if not np.any(mask):
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def acierto_direccion(y_true, y_pred, y_base=None):
    """
    Porcentaje de acierto de la direccion del cambio (sube/baja).

    Si se pasa y_base (precio del dia anterior), compara signo(pred - base)
    contra signo(real - base). Si no, usa el valor real anterior como base.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    if len(y_true) < 2:
        return 0.0

    if y_base is not None:
        base = np.asarray(y_base, dtype=float)
        dir_real = np.sign(y_true - base)
        dir_pred = np.sign(y_pred - base)
    else:
        dir_real = np.sign(y_true[1:] - y_true[:-1])
        dir_pred = np.sign(y_pred[1:] - y_true[:-1])

    mask = dir_real != 0
    if not np.any(mask):
        return 0.0

    return float(np.mean(dir_real[mask] == dir_pred[mask]) * 100)
