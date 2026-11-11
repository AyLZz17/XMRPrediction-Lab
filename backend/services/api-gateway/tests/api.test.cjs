const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const http = require("node:http");
const { RateLimiterRes } = require("rate-limiter-flexible");
const { createApp } = require("../dist/app");

const servers = [];
const urls = {};
let gateway;
let gatewayUrl;
let blockApi = false;
let blockAuth = false;
let redisUnavailable = false;

function listen(server) {
    return new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
}

before(async () => {
    const monero = http.createServer((request, response) => {
        if (request.url === "/api/v1/health") {
            response.writeHead(200, { "content-type": "application/json" });
            response.end(JSON.stringify({ status: "ok" }));
            return;
        }
        if (request.url === "/api/v1/models") {
            response.writeHead(207, { "content-type": "application/json" });
            response.end(JSON.stringify({ source: "monero-api" }));
            return;
        }
        response.writeHead(404);
        response.end();
    });

    const security = http.createServer((request, response) => {
        if (request.url === "/api/auth/health") {
            response.writeHead(200, { "content-type": "application/json" });
            response.end(JSON.stringify({ status: "ok" }));
            return;
        }
        if (request.url === "/api/auth/login") {
            response.writeHead(200, {
                "content-type": "application/json",
                "set-cookie": "aylzz_session=test-token; HttpOnly; Path=/api"
            });
            response.end(JSON.stringify({ authenticated: true }));
            return;
        }
        response.writeHead(404);
        response.end();
    });

    const market = http.createServer((request, response) => {
        if (request.url === "/ready") {
            response.writeHead(200);
            response.end();
            return;
        }
        if (request.url === "/api/v1/market") {
            response.writeHead(206, { "content-type": "application/json" });
            response.end(JSON.stringify({ source: "market-service" }));
            return;
        }
        response.writeHead(404);
        response.end();
    });

    const prediction = http.createServer((request, response) => {
        if (request.url === "/ready") {
            response.writeHead(200);
            response.end();
            return;
        }
        if (request.url === "/api/v1/predictions") {
            let body = "";
            request.setEncoding("utf8");
            request.on("data", chunk => { body += chunk; });
            request.on("end", () => {
                response.writeHead(202, { "content-type": "application/json" });
                response.end(JSON.stringify({ accepted: true, body: JSON.parse(body) }));
            });
            return;
        }
        response.writeHead(404);
        response.end();
    });

    servers.push(monero, security, market, prediction);
    await Promise.all(servers.map(listen));
    urls.monero = `http://127.0.0.1:${monero.address().port}`;
    urls.security = `http://127.0.0.1:${security.address().port}`;
    urls.market = `http://127.0.0.1:${market.address().port}`;
    urls.prediction = `http://127.0.0.1:${prediction.address().port}`;

    gateway = createApp({
        moneroApiBaseUrl: urls.monero,
        securityServiceBaseUrl: urls.security,
        marketServiceBaseUrl: urls.market,
        predictionServiceBaseUrl: urls.prediction,
        rateLimiters: {
            api: {
                consume: async () => {
                    if (blockApi) throw new RateLimiterRes(0, 60_000);
                    return { msBeforeNext: 0 };
                }
            },
            auth: {
                consume: async () => {
                    if (blockAuth) throw new RateLimiterRes(0, 60_000);
                    return { msBeforeNext: 0 };
                }
            },
            pingRedis: async () => {
                if (redisUnavailable) throw new Error("Redis unavailable");
            }
        }
    }).listen(0, "127.0.0.1");
    await new Promise(resolve => gateway.once("listening", resolve));
    gatewayUrl = `http://127.0.0.1:${gateway.address().port}`;
});

after(async () => {
    await Promise.all([
        new Promise((resolve, reject) => gateway.close(error => error ? reject(error) : resolve())),
        ...servers.map(server =>
            new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())))
    ]);
});

test("health endpoint reports gateway status", async () => {
    const response = await fetch(`${gatewayUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok", service: "api-gateway" });
});

test("readiness requires each service and Redis", async () => {
    const ready = await fetch(`${gatewayUrl}/ready`);
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { status: "ready", service: "api-gateway" });

    redisUnavailable = true;
    const notReady = await fetch(`${gatewayUrl}/ready`);
    redisUnavailable = false;
    assert.equal(notReady.status, 503);
    assert.deepEqual(await notReady.json(), { status: "not_ready", dependency: "redis" });
});

test("routes market requests to the market service", async () => {
    const response = await fetch(`${gatewayUrl}/api/v1/market`);
    assert.equal(response.status, 206);
    assert.deepEqual(await response.json(), { source: "market-service" });
});

test("routes prediction requests to the prediction service", async () => {
    const response = await fetch(`${gatewayUrl}/api/v1/predictions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "naive", seed: 0 })
    });
    assert.equal(response.status, 202);
    assert.deepEqual(await response.json(), {
        accepted: true,
        body: { model: "naive", seed: 0 }
    });
});

test("preserves fallback routes to Monero", async () => {
    const response = await fetch(`${gatewayUrl}/api/v1/models`);
    assert.equal(response.status, 207);
    assert.deepEqual(await response.json(), { source: "monero-api" });
});

test("routes authentication to the security service and preserves cookies", async () => {
    const response = await fetch(`${gatewayUrl}/api/auth/login`, { method: "POST" });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), "aylzz_session=test-token; HttpOnly; Path=/api");
    assert.deepEqual(await response.json(), { authenticated: true });
});

test("returns 429 with Retry-After when a rate limit is exceeded", async () => {
    blockApi = true;
    const apiResponse = await fetch(`${gatewayUrl}/api/v1/models`);
    blockApi = false;
    assert.equal(apiResponse.status, 429);
    assert.equal(apiResponse.headers.get("retry-after"), "60");
    assert.deepEqual(await apiResponse.json(), {
        error: "too_many_requests",
        retryAfterSeconds: 60
    });

    blockAuth = true;
    const authResponse = await fetch(`${gatewayUrl}/api/auth/login`);
    blockAuth = false;
    assert.equal(authResponse.status, 429);
});
