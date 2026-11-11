import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const readinessTimeoutMs = 3_000;
const proxyTimeoutMs = 60 * 60 * 1_000;

export function createApp(moneroApiBaseUrl: string) {
    const upstream = new URL(moneroApiBaseUrl);
    if (!["http:", "https:"].includes(upstream.protocol)) {
        throw new Error("MONERO_API_BASE_URL must use HTTP or HTTPS");
    }

    const app = express();
    app.disable("x-powered-by");

    app.get("/health", (_request, response) => {
        response.status(200).json({ status: "ok", service: "api-gateway" });
    });

    app.get("/ready", async (_request, response) => {
        try {
            const healthUrl = new URL("/api/v1/health", upstream);
            const health = await fetch(healthUrl, {
                signal: AbortSignal.timeout(readinessTimeoutMs)
            });
            if (!health.ok) {
                console.error(`Monero readiness check returned HTTP ${health.status}`);
                response.status(503).json({ status: "not_ready", dependency: "monero-api" });
                return;
            }

            response.status(200).json({ status: "ready", service: "api-gateway" });
        } catch (error) {
            console.error("Monero readiness check failed", error);
            response.status(503).json({ status: "not_ready", dependency: "monero-api" });
        }
    });

    app.use(createProxyMiddleware({
        pathFilter: "/api",
        target: upstream.origin,
        changeOrigin: true,
        timeout: proxyTimeoutMs,
        proxyTimeout: proxyTimeoutMs,
        on: {
            error(error, _request, response) {
                console.error("API gateway could not reach Monero API", error);
                if ("writeHead" in response && !response.headersSent) {
                    response.writeHead(502, { "content-type": "application/json" });
                    response.end(JSON.stringify({ error: "upstream_unavailable" }));
                }
            }
        }
    }));

    return app;
}
