import numpy as np
from src.models.base import BaseModel

class NaiveModel(BaseModel):
    nombre = "naive"

    def fit(self, X_train, y_train, X_val=None, y_val=None):
        # El modelo Naive no necesita entrenamiento interno
        print("Modelo Naive listo (no requiere entrenamiento).")

    def predict(self, X, scaler=None):
        # Toma el último valor de la ventana de tiempo como predicción (escalado)
        preds_scaled = X[:, -1, 0] if X.ndim == 3 else X[:, -1]
        
        # Desescalar a USD si se proporciona el scaler
        if scaler is not None:
            preds_scaled = preds_scaled.reshape(-1, 1)
            preds_usd = scaler.inverse_transform(preds_scaled)
            return preds_usd.flatten()
            
        return preds_scaled

    def save(self, filepath):
        pass  # No guarda pesos porque no aprende parámetros

    def load(self, filepath):
        pass