import express from "express";
import {
    attachObservability,
    type ObservabilityLogger
} from "@aylzz/shared-observability";
import { z } from "zod";
import { marketResponseSchema, type MarketResponse } from "./contracts";
import { marketResponseFromStoredRows, type MarketStore } from "./store";

const requestTimeoutMs = 30_000;
const refreshTimeoutMs = 60 * 60 * 1_000;
const limitSchema = z.coerce.number().int().min(1).max(3650);

export function createApp(moneroApiBaseUrl: string, store: MarketStore) {
    const moneroApi = new URL(moneroApiBaseUrl);
    if (!["http:", "https:"].includes(moneroApi.protocol)) {
        throw new Error("MONERO_API_BASE_URL must use HTTP or HTTPS");
    }

    const app = express();
    app.disable("x-powered-by");
    const logger = attachObservability(app, "market-service", (_method, path) => {
        if (path === "/health" || path === "/ready"
            || path === "/api/v1/market" || path === "/api/v1/market/refresh") {
            return path;
        }
        return "unmatched";
    });

    app.get("/health", (_request, response) => {
        response.status(200).json({ status: "ok", service: "market-service" });
    });

    app.get("/ready", async (_request, response) => {
        try {
            await store.ping();
            response.status(200).json({ status: "ready", service: "market-service" });
        } catch (error) {
            logger.logError("MongoDB readiness check failed", error);
            response.status(503).json({ status: "not_ready", dependency: "market-mongodb" });
        }
    });

    app.get("/api/v1/market", async (request, response) => {
        const rawLimit = typeof request.query.limit === "string" ? request.query.limit : "365";
        const parsedLimit = limitSchema.safeParse(rawLimit);
        if (!parsedLimit.success) {
            response.status(400).json({ error: "invalid_limit", minimum: 1, maximum: 3650 });
            return;
        }

        let upstream: Response;
        try {
            const url = new URL("/api/v1/market", moneroApi);
            url.searchParams.set("limit", String(parsedLimit.data));
            upstream = await fetch(url, {
                signal: AbortSignal.timeout(requestTimeoutMs)
            });
        } catch (error) {
            logger.logError("Could not reach Monero API", error);
            response.status(502).json({ error: "monero_api_unavailable" });
            return;
        }

        if (!upstream.ok) {
            await forwardUpstreamError(upstream, response);
            return;
        }

        const payload = await readMarketPayload(upstream, logger);
        if (!payload) {
            response.status(502).json({ error: "invalid_monero_market_response" });
            return;
        }

        try {
            await store.upsert(payload.symbol, payload.rows);
            const storedRows = await store.listLatest(payload.symbol, payload.rows.length);
            response.status(200).json(marketResponseFromStoredRows(payload, storedRows));
        } catch (error) {
            logger.logError("Could not persist market data", error);
            response.status(503).json({ error: "market_storage_unavailable" });
        }
    });

    app.post("/api/v1/market/refresh", async (_request, response) => {
        let upstream: Response;
        try {
            upstream = await fetch(new URL("/api/v1/market/refresh", moneroApi), {
                method: "POST",
                signal: AbortSignal.timeout(refreshTimeoutMs)
            });
        } catch (error) {
            logger.logError("Market refresh could not reach Monero API", error);
            response.status(502).json({ error: "monero_api_unavailable" });
            return;
        }

        if (!upstream.ok) {
            await forwardUpstreamError(upstream, response);
            return;
        }

        const payload = await readMarketPayload(upstream, logger);
        if (!payload) {
            response.status(502).json({ error: "invalid_monero_market_response" });
            return;
        }

        try {
            await store.upsert(payload.symbol, payload.rows);
            const storedRows = await store.listLatest(payload.symbol, payload.rows.length);
            response.status(200).json(marketResponseFromStoredRows(payload, storedRows));
        } catch (error) {
            logger.logError("Could not persist refreshed market data", error);
            response.status(503).json({ error: "market_storage_unavailable" });
        }
    });

    return app;
}

async function readMarketPayload(
    response: Response,
    logger: ObservabilityLogger
): Promise<MarketResponse | null> {
    let body: unknown;
    try {
        body = await response.json();
    } catch (error) {
        logger.logError("Monero market API returned invalid JSON", error);
        return null;
    }

    const parsed = marketResponseSchema.safeParse(body);
    if (!parsed.success) {
        logger.logError("Monero market API response did not match the OHLCV contract");
        return null;
    }
    return parsed.data;
}

async function forwardUpstreamError(
    upstream: Response,
    response: express.Response
): Promise<void> {
    const body = await upstream.text();
    response.status(upstream.status)
        .type(upstream.headers.get("content-type") ?? "text/plain")
        .send(body);
}
