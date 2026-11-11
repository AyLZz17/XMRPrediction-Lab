import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const readinessTimeoutMs = 3_000;
const proxyTimeoutMs = 60 * 60 * 1_000;

export function createApp(
    moneroApiBaseUrl: string,
    securityServiceBaseUrl = process.env.SECURITY_SERVICE_BASE_URL
        ?? "http://security-service:8081"
) {
    const moneroApi = new URL(moneroApiBaseUrl);
    const securityService = new URL(securityServiceBaseUrl);
    for (const [name, url] of [
        ["MONERO_API_BASE_URL", moneroApi],
        ["SECURITY_SERVICE_BASE_URL", securityService]
    ] as const) {
        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error(`${name} must use HTTP or HTTPS`);
        }
    }

    const app = express();
    app.disable("x-powered-by");

    app.get("/health", (_request, response) => {
        response.status(200).json({ status: "ok", service: "api-gateway" });
    });

    app.get("/ready", async (_request, response) => {
        try {
            const [moneroHealth, securityHealth] = await Promise.all([
                fetch(new URL("/api/v1/health", moneroApi), {
                    signal: AbortSignal.timeout(readinessTimeoutMs)
                }),
                fetch(new URL("/api/auth/health", securityService), {
                    signal: AbortSignal.timeout(readinessTimeoutMs)
                })
            ]);
            if (!moneroHealth.ok || !securityHealth.ok) {
                const dependency = moneroHealth.ok ? "security-service" : "monero-api";
                console.error(`API gateway dependency is not healthy: ${dependency}`);
                response.status(503).json({ status: "not_ready", dependency });
                return;
            }

            response.status(200).json({ status: "ready", service: "api-gateway" });
        } catch (error) {
            console.error("Monero readiness check failed", error);
            response.status(503).json({ status: "not_ready", dependency: "monero-api" });
        }
    });

    app.use(createServiceProxy(
        securityService.origin,
        path => path === "/api/auth" || path.startsWith("/api/auth/"),
        "security-service"
    ));
    app.use(createServiceProxy(
        moneroApi.origin,
        path => path.startsWith("/api/") && path !== "/api/auth",
        "monero-api"
    ));

    return app;
}

function createServiceProxy(
    target: string,
    pathFilter: (path: string) => boolean,
    serviceName: string
) {
    return createProxyMiddleware({
        pathFilter,
        target,
        changeOrigin: true,
        timeout: proxyTimeoutMs,
        proxyTimeout: proxyTimeoutMs,
        on: {
            error(error, _request, response) {
                console.error(`API gateway could not reach ${serviceName}`, error);
                if ("writeHead" in response && !response.headersSent) {
                    response.writeHead(502, { "content-type": "application/json" });
                    response.end(JSON.stringify({ error: "upstream_unavailable" }));
                }
            }
        }
    });
}
