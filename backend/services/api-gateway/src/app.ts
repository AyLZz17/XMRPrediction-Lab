import express, { type NextFunction, type Request, type Response } from "express";
import { RateLimiterRes } from "rate-limiter-flexible";
import { createProxyMiddleware } from "http-proxy-middleware";

const readinessTimeoutMs = 3_000;
const proxyTimeoutMs = 60 * 60 * 1_000;

export interface GatewayRateLimiter {
    consume(key: string): Promise<{ msBeforeNext: number }>;
}

export interface GatewayRateLimiters {
    api: GatewayRateLimiter;
    auth: GatewayRateLimiter;
    pingRedis(): Promise<void>;
}

export interface GatewayTargets {
    moneroApiBaseUrl: string;
    securityServiceBaseUrl: string;
    marketServiceBaseUrl: string;
    predictionServiceBaseUrl: string;
    rateLimiters?: GatewayRateLimiters;
}

export function createApp(targets: GatewayTargets) {
    const moneroApi = parseHttpUrl("MONERO_API_BASE_URL", targets.moneroApiBaseUrl);
    const securityService = parseHttpUrl(
        "SECURITY_SERVICE_BASE_URL",
        targets.securityServiceBaseUrl
    );
    const marketService = parseHttpUrl(
        "MARKET_SERVICE_BASE_URL",
        targets.marketServiceBaseUrl
    );
    const predictionService = parseHttpUrl(
        "PREDICTION_SERVICE_BASE_URL",
        targets.predictionServiceBaseUrl
    );

    const app = express();
    app.disable("x-powered-by");
    app.set("trust proxy", 1);

    app.get("/health", (_request, response) => {
        response.status(200).json({ status: "ok", service: "api-gateway" });
    });

    app.get("/ready", async (_request, response) => {
        const dependencies = await Promise.all([
            checkDependency("monero-api", new URL("/api/v1/health", moneroApi)),
            checkDependency("security-service", new URL("/api/auth/health", securityService)),
            checkDependency("market-service", new URL("/ready", marketService)),
            checkDependency("prediction-service", new URL("/ready", predictionService))
        ]);
        const unhealthy = dependencies.find(dependency => !dependency.ready);
        if (unhealthy) {
            response.status(503).json({
                status: "not_ready",
                dependency: unhealthy.name
            });
            return;
        }

        if (targets.rateLimiters) {
            try {
                await targets.rateLimiters.pingRedis();
            } catch (error) {
                console.error("API gateway Redis readiness check failed", error);
                response.status(503).json({ status: "not_ready", dependency: "redis" });
                return;
            }
        }

        response.status(200).json({ status: "ready", service: "api-gateway" });
    });

    if (targets.rateLimiters) {
        app.use("/api", rateLimit(targets.rateLimiters.api, "api"));
        app.use("/api/auth", rateLimit(targets.rateLimiters.auth, "auth"));
    }

    app.use(createServiceProxy(
        securityService.origin,
        path => path === "/api/auth" || path.startsWith("/api/auth/"),
        "security-service"
    ));
    app.use(createServiceProxy(
        marketService.origin,
        path => path === "/api/v1/market"
            || path.startsWith("/api/v1/market/"),
        "market-service"
    ));
    app.use(createServiceProxy(
        predictionService.origin,
        path => path === "/api/v1/predictions"
            || path.startsWith("/api/v1/predictions/"),
        "prediction-service"
    ));
    app.use(createServiceProxy(
        moneroApi.origin,
        path => path.startsWith("/api/"),
        "monero-api"
    ));

    return app;
}

function parseHttpUrl(name: string, value: string): URL {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error(`${name} must use HTTP or HTTPS`);
    }
    return url;
}

async function checkDependency(
    name: string,
    healthUrl: URL
): Promise<{ name: string; ready: boolean }> {
    try {
        const response = await fetch(healthUrl, {
            signal: AbortSignal.timeout(readinessTimeoutMs)
        });
        if (!response.ok) {
            console.error(`${name} readiness returned HTTP ${response.status}`);
        }
        return { name, ready: response.ok };
    } catch (error) {
        console.error(`${name} readiness check failed`, error);
        return { name, ready: false };
    }
}

function rateLimit(limiter: GatewayRateLimiter, keyPrefix: string) {
    return (request: Request, response: Response, next: NextFunction): void => {
        const key = request.ip || request.socket.remoteAddress || "unknown";
        limiter.consume(key).then(() => next()).catch(error => {
            if (error instanceof RateLimiterRes) {
                const retryAfterSeconds = Math.max(1, Math.ceil(error.msBeforeNext / 1000));
                response.setHeader("Retry-After", String(retryAfterSeconds));
                response.status(429).json({
                    error: "too_many_requests",
                    retryAfterSeconds
                });
                return;
            }

            console.error(`Redis ${keyPrefix} rate limiter failed`, error);
            response.status(503).json({ error: "rate_limit_unavailable" });
        });
    };
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
