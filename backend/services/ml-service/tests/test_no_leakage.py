import numpy as np
from sklearn.preprocessing import MinMaxScaler

def test_scaler_no_leakage():
    """
    Verifica que el MinMaxScaler se ajuste únicamente con los datos de entrenamiento
    y que los valores máximos/mínimos de test no hayan sido filtrados al scaler.
    """
    # Simulamos datos de train y test con escalas totalmente distintas
    train_data = np.array([10, 20, 30, 40], dtype=float).reshape(-1, 1)
    test_data = np.array([100, 200, 300, 400], dtype=float).reshape(-1, 1)
    
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaler.fit(train_data)
    
    # El mínimo y máximo del scaler deben reflejar SOLO el train (10 y 40)
    assert scaler.data_min_[0] == 10.0
    assert scaler.data_max_[0] == 40.0
    
    # Si transformamos test con el scaler de train, los valores escalados superarán 1.0,
    # lo cual confirma que el scaler no absorbió los límites de test (sin data leakage).
    test_transformed = scaler.transform(test_data)
    assert np.any(test_transformed > 1.0)