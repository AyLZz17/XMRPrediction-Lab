import { z } from "zod";

export const predictionRequestSchema = z.object({
    model: z.enum(["naive", "moving_average", "arima", "lstm", "gru"]),
    seed: z.number().int().min(0).max(10_000).default(0)
});

export const predictionResponseSchema = z.object({
    prediction: z.object({
        modelo: z.string().min(1)
    }).passthrough(),
    market: z.object({
        symbol: z.string().min(1)
    }).passthrough()
});

export type PredictionRequest = z.infer<typeof predictionRequestSchema>;
export type PredictionResponse = z.infer<typeof predictionResponseSchema>;
