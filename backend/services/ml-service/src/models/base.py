from abc import ABC, abstractmethod


class BaseModel(ABC):
    """Contrato comun para todos los modelos del proyecto."""

    # Extension del artefacto entrenado (las redes usan .keras)
    extension = ".pkl"
    nombre = "base"

    @abstractmethod
    def fit(self, X_train, y_train, X_val=None, y_val=None):
        """Metodo para entrenar el modelo."""

    @abstractmethod
    def predict(self, X, scaler=None):
        """Devuelve el objetivo predicho, desescalado si se pasa el scaler."""

    def save(self, filepath):
        """Guarda el modelo entrenado (por defecto no hay parametros que guardar)."""

    def load(self, filepath):
        """Carga un modelo previamente guardado."""
