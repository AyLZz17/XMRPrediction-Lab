import os

# Directorio raíz del proyecto
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Rutas de datos
DATA_RAW_DIR = os.path.join(ROOT_DIR, "data", "raw")
DATA_PROCESSED_DIR = os.path.join(ROOT_DIR, "data", "processed")

# Activo a descargar
TICKER = "XMR-USD"

# --- CONSTANTES DE PROCESAMIENTO Y MODELADO ---
WINDOW_SIZE = 30       # Días históricos que usará el modelo para predecir el siguiente
TRAIN_SPLIT = 0.8      # Porcentaje de datos para entrenamiento (80% train, 20% test)
RANDOM_SEED = 42       # Semilla aleatoria para reproducibilidad
SEEDS = [0, 1, 2]
OBJETIVOS = ["precio", "retorno"]
START = "2017-11-09"
# --- DIRECTORIOS DE ARTEFACTOS Y RESULTADOS ---
MODELS_DIR = os.path.join(ROOT_DIR, "models")
RESULTS_METRICS_DIR = os.path.join(ROOT_DIR, "results", "metrics")
RESULTS_PRED_DIR = os.path.join(ROOT_DIR, "results", "predictions")
RESULTS_FIG_DIR = os.path.join(ROOT_DIR, "results", "figures")