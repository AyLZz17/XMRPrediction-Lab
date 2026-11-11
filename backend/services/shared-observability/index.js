const { randomUUID } = require("node:crypto");
const { Counter, Histogram, Registry, collectDefaultMetrics } = require("@prometheus-io/client");

const requestIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const histogramBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];

function attachObservability(app, serviceName, routeResolver = () => "unmatched") {
    const registry = new Registry();
    registry.setDefaultLabels({ service: serviceName });
    collectDefaultMetrics({ register: registry });

    const requests = new Counter({
        name: "http_requests_total",
        help: "Total HTTP requests completed by this service",
        labelNames: ["method", "route", "status_code"],
        registers: [registry]
    });
    const duration = new Histogram({
        name: "http_request_duration_seconds",
        help: "HTTP request duration in seconds",
        labelNames: ["method", "route", "status_code"],
        buckets: histogramBuckets,
        registers: [registry]
    });

    const logInfo = message => writeLog("info", serviceName, message);
    const logError = (message, error) => writeLog("error", serviceName, message, error);

    app.use((request, response, next) => {
        const suppliedRequestId = request.headers["x-request-id"];
        const requestId = typeof suppliedRequestId === "string"
            && requestIdPattern.test(suppliedRequestId)
            ? suppliedRequestId
            : randomUUID();
        const requestPath = typeof request.originalUrl === "string"
            ? request.originalUrl.split("?")[0]
            : request.path;
        request.headers["x-request-id"] = requestId;
        response.setHeader("X-Request-ID", requestId);
        const startedAt = process.hrtime.bigint();

        response.on("finish", () => {
            if (requestPath === "/metrics") {
                return;
            }

            const route = safeRoute(routeResolver(request.method, requestPath));
            const labels = {
                method: request.method,
                route,
                status_code: String(response.statusCode)
            };
            const seconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
            requests.inc(labels);
            duration.observe(labels, seconds);
            writeLog(
                response.statusCode >= 500 ? "error" : response.statusCode >= 400 ? "warn" : "info",
                serviceName,
                "http_request_completed",
                undefined,
                {
                    request_id: requestId,
                    method: request.method,
                    route,
                    status_code: response.statusCode,
                    duration_ms: Math.round(seconds * 1000)
                }
            );
        });

        next();
    });

    app.get("/metrics", async (_request, response) => {
        try {
            response.setHeader("Content-Type", registry.contentType);
            response.end(await registry.metrics());
        } catch (error) {
            logError("metrics_endpoint_failed", error);
            response.statusCode = 503;
            response.end();
        }
    });

    return { logInfo, logError };
}

function logInfo(serviceName, message) {
    writeLog("info", serviceName, message);
}

function logError(serviceName, message, error) {
    writeLog("error", serviceName, message, error);
}

function writeLog(level, service, message, error, fields = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        service,
        message,
        ...fields
    };
    if (error !== undefined) {
        entry.error_type = error instanceof Error ? error.name : typeof error;
    }
    const output = JSON.stringify(entry);
    if (level === "error") {
        console.error(output);
    } else {
        console.log(output);
    }
}

function safeRoute(route) {
    if (typeof route !== "string" || route.length === 0) {
        return "unmatched";
    }
    return route.replace(/[^A-Za-z0-9_/:{}.*-]/g, "_").slice(0, 100);
}

module.exports = { attachObservability, logError, logInfo };
