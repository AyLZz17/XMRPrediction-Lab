import { isRecord, requestJson } from "./http";
import type { MarketSnapshot } from "./market";
import { parseMarketSnapshot } from "./market";

export const modelIds = ["naive", "moving_average", "arima", "lstm", "gru"] as const;
export type ModelId = typeof modelIds[number];
export type MetricId = "mae" | "rmse" | "mape";

export interface ModelMetrics {
    id: ModelId;
    name: string;
    objective: string;
    seeds: number;
    mae: number;
    rmse: number;
    mape: number;
    direction: number;
}

export interface ModelBenchmark {
    models: ModelMetrics[];
    updated_at: string | null;
}

export interface Prediction {
    modelo: ModelId;
    semilla: number;
    fecha_ultimo_dato: string;
    fecha_prediccion: string;
    precio_actual: number;
    precio_predicho: number;
    cambio_pct: number;
    direccion: string;
    metricas_test: {
        MAE?: number;
        MAPE?: number;
        acierto_direccion?: number;
    };
}

export interface PredictionResult {
    prediction: Prediction;
    market: MarketSnapshot;
}

export async function getBenchmark(): Promise<ModelBenchmark> {
    const payload = await requestJson("/api/v1/models");
    if (!isRecord(payload) || !Array.isArray(payload.models)
        || !(typeof payload.updated_at === "string" || payload.updated_at === null)) {
        throw new Error("The models service returned an invalid benchmark.");
    }
    return {
        models: payload.models.map(parseModelMetrics),
        updated_at: payload.updated_at
    };
}

export async function runPrediction(model: ModelId, seed = 0): Promise<PredictionResult> {
    const payload = await requestJson("/api/v1/predictions", {
        method: "POST",
        body: JSON.stringify({ model, seed })
    });
    if (!isRecord(payload)) throw new Error("The prediction service returned an invalid response.");
    return {
        prediction: parsePrediction(payload.prediction),
        market: parsePredictionMarket(payload.market)
    };
}

function parseModelMetrics(value: unknown): ModelMetrics {
    if (!isRecord(value) || !isModelId(value.id)
        || typeof value.name !== "string" || typeof value.objective !== "string"
        || typeof value.seeds !== "number" || !Number.isInteger(value.seeds)) {
        throw new Error("The models service returned invalid benchmark metrics.");
    }
    const mae = finiteNumber(value.mae);
    const rmse = finiteNumber(value.rmse);
    const mape = finiteNumber(value.mape);
    const direction = finiteNumber(value.direction);
    if (mae === null || rmse === null || mape === null || direction === null) {
        throw new Error("The models service returned invalid benchmark metrics.");
    }
    return {
        id: value.id,
        name: value.name,
        objective: value.objective,
        seeds: value.seeds,
        mae,
        rmse,
        mape,
        direction
    };
}

function parsePrediction(value: unknown): Prediction {
    if (!isRecord(value) || !isModelId(value.modelo)
        || typeof value.semilla !== "number" || !Number.isInteger(value.semilla)
        || typeof value.fecha_ultimo_dato !== "string"
        || typeof value.fecha_prediccion !== "string" || typeof value.precio_actual !== "number"
        || !Number.isFinite(value.precio_actual) || typeof value.precio_predicho !== "number"
        || !Number.isFinite(value.precio_predicho) || typeof value.cambio_pct !== "number"
        || !Number.isFinite(value.cambio_pct)
        || typeof value.direccion !== "string" || !isRecord(value.metricas_test)) {
        throw new Error("The prediction service returned an invalid prediction.");
    }
    return {
        modelo: value.modelo,
        semilla: value.semilla,
        fecha_ultimo_dato: value.fecha_ultimo_dato,
        fecha_prediccion: value.fecha_prediccion,
        precio_actual: value.precio_actual,
        precio_predicho: value.precio_predicho,
        cambio_pct: value.cambio_pct,
        direccion: value.direccion,
        metricas_test: {
            MAE: numberMetric(value.metricas_test.MAE),
            MAPE: numberMetric(value.metricas_test.MAPE),
            acierto_direccion: numberMetric(value.metricas_test.acierto_direccion)
        }
    };
}

function parsePredictionMarket(value: unknown): MarketSnapshot {
    try {
        return parseMarketSnapshot(value);
    } catch (error) {
        console.error("Prediction service returned invalid market context", error);
        throw new Error("The prediction service returned invalid market context.");
    }
}

function isModelId(value: unknown): value is ModelId {
    return modelIds.some(id => id === value);
}

function numberMetric(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function finiteNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
