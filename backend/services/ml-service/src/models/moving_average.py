import numpy as np
from src.models.base import BaseModel

class MovingAverageModel(BaseModel):
    nombre = "moving_average"

    def __init__(self, window=7):
        super().__init__()
        self.window = window

    def fit(self, X_train, y_train, X_val=None, y_val=None):
        # El modelo de media móvil no requiere entrenamiento de parámetros
        print(f"Modelo Moving Average (ventana={self.window} días) listo.")

    def predict(self, X, scaler=None):
        """
        Calcula la media móvil de los últimos 'window' días dentro de cada ventana de entrada X.
        """
        if len(X.shape) == 3:
            data = X[:, :, 0]
        else:
            data = X

        # Tomamos los últimos 'window' días de cada fila y calculamos la media
        preds_scaled = np.mean(data[:, -self.window:], axis=1).reshape(-1, 1)

        # Desescalar a USD si se proporciona el scaler
        if scaler is not None:
            preds_usd = scaler.inverse_transform(preds_scaled)
            return preds_usd.flatten()

        return preds_scaled.flatten()

    def save(self, filepath):
        pass  # No guarda pesos porque no aprende parámetros

    def load(self, filepath):
        pass