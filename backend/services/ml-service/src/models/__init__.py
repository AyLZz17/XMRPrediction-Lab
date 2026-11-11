"""Registro central de modelos. Importar este modulo no carga TensorFlow ni statsmodels."""

from src.models.arima import ARIMAModel
from src.models.gru import GRUModel
from src.models.lstm import LSTMModel
from src.models.moving_average import MovingAverageModel
from src.models.naive import NaiveModel

REGISTRY = {
    "naive": NaiveModel,
    "moving_average": MovingAverageModel,
    "arima": ARIMAModel,
    "lstm": LSTMModel,
    "gru": GRUModel,
}

__all__ = [
    "REGISTRY",
    "NaiveModel",
    "MovingAverageModel",
    "ARIMAModel",
    "LSTMModel",
    "GRUModel",
]
