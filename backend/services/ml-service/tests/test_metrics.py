import pytest
import numpy as np
from src.evaluation.metrics import mae, rmse, mape, acierto_direccion

def test_mae():
    y_true = [1, 2, 3]
    y_pred = [1, 2, 4]
    # Errores absolutos: [0, 0, 1] -> Suma = 1 -> Media = 1/3
    assert pytest.approx(mae(y_true, y_pred), 0.001) == 1.0 / 3.0

def test_rmse():
    y_true = [1, 2, 3]
    y_pred = [1, 2, 4]
    # Errores cuadrados: [0, 0, 1] -> Media = 1/3 -> Raíz cuad = sqrt(1/3)
    expected = np.sqrt(1.0 / 3.0)
    assert pytest.approx(rmse(y_true, y_pred), 0.001) == expected

def test_mape():
    y_true = [100, 200]
    y_pred = [110, 190]
    # Errores absolutos: [10, 10] -> Relativos: [10/100, 10/200] = [0.1, 0.05] -> Media = 0.075 * 100 = 7.5%
    assert pytest.approx(mape(y_true, y_pred), 0.001) == 7.5

def test_acierto_direccion():
    y_true = [10, 12, 11]  # Cambios: +2, -1
    y_pred = [10, 13, 10]  # Cambios predichos: +3 (acierta), -2 (acierta)
    assert acierto_direccion(y_true, y_pred) == 100.0


def test_acierto_direccion_con_base_explicita():
    y_true = [10, 12, 11]
    y_pred = [10, 9, 10]
    base = [10, 10, 12]  # 0, +2/-1 reales ; -1/-2 predichos -> acierta solo el ultimo
    assert acierto_direccion(y_true, y_pred, y_base=base) == 50.0