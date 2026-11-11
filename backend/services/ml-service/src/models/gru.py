import numpy as np
from src.config import WINDOW_SIZE
from src.models.base import BaseModel


class GRUModel(BaseModel):
    """GRU de 2 capas (100 unidades) con dropout y early stopping."""

    nombre = "gru"
    extension = ".keras"

    def __init__(self, units=100, dropout=0.2, lr=0.001, window_size=WINDOW_SIZE):
        super().__init__()
        self.units = units
        self.dropout = dropout
        self.lr = lr
        self.window_size = window_size
        self.model = self._build_model()

    def _build_model(self):
        import tensorflow as tf
        from tensorflow.keras.layers import Dense, Dropout, GRU
        from tensorflow.keras.models import Sequential

        model = Sequential([
            GRU(self.units, return_sequences=True, input_shape=(self.window_size, 1)),
            Dropout(self.dropout),
            GRU(self.units, return_sequences=False),
            Dropout(self.dropout),
            Dense(1),
        ])
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=self.lr),
            loss="mse",
            metrics=["mae"],
        )
        return model

    def fit(self, X_train, y_train, X_val=None, y_val=None, epochs=50, batch_size=32):
        from tensorflow.keras.callbacks import EarlyStopping

        callbacks = [
            EarlyStopping(
                monitor="val_loss",
                patience=5,
                restore_best_weights=True,
                verbose=1,
            )
        ]

        validation_data = (X_val, y_val) if X_val is not None and y_val is not None else None

        self.model.fit(
            X_train,
            y_train,
            validation_data=validation_data,
            validation_split=0.0 if validation_data is not None else 0.1,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=2,
        )

    def predict(self, X, scaler=None):
        preds_scaled = self.model.predict(X, verbose=0).reshape(-1, 1)

        if scaler is not None:
            return scaler.inverse_transform(preds_scaled).flatten()

        return preds_scaled.flatten()

    def save(self, filepath):
        self.model.save(filepath)

    def load(self, filepath):
        from tensorflow.keras.models import load_model

        self.model = load_model(filepath)
