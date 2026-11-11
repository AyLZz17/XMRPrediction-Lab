import numpy as np
import pytest
from src.models.naive import NaiveModel
from src.models.moving_average import MovingAverageModel
from src.models.arima import ARIMAModel
from sklearn.preprocessing import MinMaxScaler

def test_models_contract():
    """
    Verifica que los modelos cumplan el contrato:
    - Tengan los métodos fit() y predict()
    - Devuelvan un array de forma (n,) con valores en USD reales si se pasa el scaler.
    """
    # Generamos datos sintéticos de prueba con forma de ventana (muestras, tiempo, 1)
    X_train = np.random.rand(50, 30, 1) * 50 + 100
    y_train = X_train[:, -1, 0]
    X_test = np.random.rand(10, 30, 1) * 50 + 100
    
    # Scaler auxiliar simulado
    scaler = MinMaxScaler()
    scaler.fit(np.vstack([X_train.reshape(-1, 1), X_test.reshape(-1, 1)]))
    
    models = [
        NaiveModel(),
        MovingAverageModel(window=7)
    ]
    
    for model in models:
        # Comprobar existencia de métodos del contrato
        assert hasattr(model, "fit"), f"El modelo {type(model)} no tiene fit()"
        assert hasattr(model, "predict"), f"El modelo {type(model)} no tiene predict()"
        
        # Ejecutar fit y predict
        model.fit(X_train, y_train)
        preds = model.predict(X_test, scaler=scaler)
        
        # Validar salidas
        assert isinstance(preds, np.ndarray), f"El modelo {type(model)} no devuelve un numpy array"
        assert preds.shape == (len(X_test),), f"El modelo {type(model)} no devuelve forma (n,)"


def test_arima_contract():
    """ARIMA tambien cumple fit/predict y devuelve una prediccion por ventana."""
    rng = np.random.default_rng(0)
    serie = 100 + np.cumsum(rng.normal(0, 1, 160)).reshape(-1, 1)
    X = np.array([serie[i - 30:i, 0] for i in range(30, len(serie))]).reshape(-1, 30, 1)
    y = serie[30:, 0]

    modelo = ARIMAModel(order=(1, 1, 0))
    modelo.fit(X[:100], y[:100])
    preds = modelo.predict(X[100:110])

    assert preds.shape == (10,)
    assert np.all(np.isfinite(preds))
