import express from "express";
import { z } from "zod";
import {
    predictionRequestSchema,
    predictionResponseSchema
} from "./contracts";
import type { PredictionStore } from "./store";

const requestTimeoutMs = 60 * 60 * 1_000;
const historyLimitSchema = z.coerce.number().int().min(1).max(1000);

export function createApp(moneroApiBaseUrl: string, store: PredictionStore) {
    const moneroApi = new URL(moneroApiBaseUrl);
    if (!["http:", "https:"].includes(moneroApi.protocol)) {
        throw new Error("MONERO_API_BASE_URL must use HTTP or HTTPS");
    }

    const app = express();
    app.disable("x-powered-by");
    app.use(express.json({ limit: "16kb" }));

    app.get("/health", (_request, response) => {
        response.status(200).json({ status: "ok", service: "prediction-service" });
    });

    app.get("/ready", async (_request, response) => {
        try {
            await store.ping();
            response.status(200).json({ status: "ready", service: "prediction-service" });
        } catch (error) {
            console.error("Prediction MongoDB readiness check failed", error);
            response.status(503).json({ status: "not_ready", dependency: "prediction-mongodb" });
        }
    });

    app.get("/api/v1/predictions/history", async (request, response) => {
        const rawLimit = typeof request.query.limit === "string" ? request.query.limit : "100";
        const parsedLimit = historyLimitSchema.safeParse(rawLimit);
        if (!parsedLimit.success) {
            response.status(400).json({ error: "invalid_limit", minimum: 1, maximum: 1000 });
            return;
        }

        try {
            const items = await store.listLatest(parsedLimit.data);
            response.status(200).json({ items, count: items.length });
        } catch (error) {
            console.error("Prediction history could not be read from MongoDB", error);
            response.status(503).json({ error: "prediction_storage_unavailable" });
        }
    });

    app.post("/api/v1/predictions", async (request, response) => {
        const parsedRequest = predictionRequestSchema.safeParse(request.body);
        if (!parsedRequest.success) {
            response.status(400).json({ error: "invalid_prediction_request" });
            return;
        }

        let upstream: Response;
        try {
            upstream = await fetch(new URL("/api/v1/predictions", moneroApi), {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(parsedRequest.data),
                signal: AbortSignal.timeout(requestTimeoutMs)
            });
        } catch (error) {
            console.error("Prediction service could not reach Monero API", error);
            response.status(502).json({ error: "monero_api_unavailable" });
            return;
        }

        if (!upstream.ok) {
            const body = await upstream.text();
            response.status(upstream.status)
                .type(upstream.headers.get("content-type") ?? "text/plain")
                .send(body);
            return;
        }

        let body: unknown;
        try {
            body = await upstream.json();
        } catch (error) {
            console.error("Monero prediction API returned invalid JSON", error);
            response.status(502).json({ error: "invalid_monero_prediction_response" });
            return;
        }
        const parsedResponse = predictionResponseSchema.safeParse(body);
        if (!parsedResponse.success) {
            console.error("Monero prediction API response did not match its contract");
            response.status(502).json({ error: "invalid_monero_prediction_response" });
            return;
        }

        try {
            await store.save(parsedRequest.data, parsedResponse.data);
            response.status(200).json(parsedResponse.data);
        } catch (error) {
            console.error("Prediction result could not be persisted", error);
            response.status(503).json({ error: "prediction_storage_unavailable" });
        }
    });

    return app;
}
