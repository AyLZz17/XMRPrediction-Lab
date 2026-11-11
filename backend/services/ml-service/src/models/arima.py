import numpy as np
from src.models.base import BaseModel


class ARIMAModel(BaseModel):
    """
    ARIMA(p,d,q) con orden elegido por AIC sobre el train y pronostico
    walk-forward de 1 paso (sin reajustar en cada iteracion).
    """

    nombre = "arima"
    extension = ".pkl"

    def __init__(self, order=None):
        super().__init__()
        self.order = order  # Si es None, se busca por AIC
        self.best_order = (1, 1, 1)  # Valor por defecto defensivo
        self.history = None

    def _crear_arima(self, serie):
        # Import perezoso: statsmodels solo se carga si se usa ARIMA
        from statsmodels.tsa.arima.model import ARIMA

        return ARIMA(serie, order=self.best_order)

    def fit(self, X_train, y_train, X_val=None, y_val=None):
        if y_train is not None:
            train_series = np.asarray(y_train, dtype=float).flatten()
        else:
            train_series = np.asarray(X_train, dtype=float).flatten()

        self.history = list(train_series)

        if self.order is not None:
            self.best_order = tuple(self.order)
            return

        # Busqueda simple por AIC (grid liviano para p, d, q)
        from statsmodels.tsa.arima.model import ARIMA

        best_aic = float("inf")
        best_ord = (1, 1, 1)

        print("Buscando el mejor orden (p,d,q) por AIC para ARIMA...")
        for p in range(3):
            for d in range(2):
                for q in range(3):
                    try:
                        results = ARIMA(self.history, order=(p, d, q)).fit()
                        if results.aic < best_aic:
                            best_aic = results.aic
                            best_ord = (p, d, q)
                    except Exception:
                        continue
        self.best_order = best_ord
        print(f"Mejor orden ARIMA encontrado por AIC: {self.best_order} (AIC: {best_aic:.2f})")

    def predict(self, X, scaler=None):
        """
        Pronostico de 1 paso. En cada iteracion usa como historia los valores
        reales ya disponibles (ultimo valor de la ventana siguiente), por lo que
        la prediccion del dia t solo ve informacion hasta t-1.
        """
        if len(X.shape) == 3:
            test_sequences = X[:, :, 0]
        else:
            test_sequences = np.asarray(X)

        current = list(self.history)
        results = self._crear_arima(current).fit()

        predictions = []
        for i in range(len(test_sequences)):
            if (i + 1) % 100 == 0:
                print(f"  ARIMA walk-forward: {i + 1}/{len(test_sequences)} dias")
            try:
                pred = float(np.asarray(results.forecast(steps=1)).flatten()[0])
            except Exception:
                # Fallback defensivo si ARIMA diverge en algun punto
                pred = current[-1]

            predictions.append(pred)

            # El valor real del objetivo de esta iteracion es el ultimo valor
            # de la ventana siguiente (si existe).
            if i + 1 < len(test_sequences):
                actual = float(test_sequences[i + 1][-1])
                current.append(actual)
                try:
                    results = results.append([actual], refit=False)
                except Exception:
                    results = self._crear_arima(current).fit()

        preds_scaled = np.array(predictions).reshape(-1, 1)

        if scaler is not None:
            return scaler.inverse_transform(preds_scaled).flatten()

        return preds_scaled.flatten()

    def save(self, filepath):
        import joblib

        joblib.dump({"order": self.best_order, "history": self.history}, filepath)

    def load(self, filepath):
        import joblib

        datos = joblib.load(filepath)
        self.best_order = tuple(datos["order"])
        self.history = list(datos["history"])
