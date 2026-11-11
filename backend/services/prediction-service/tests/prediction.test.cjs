const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const http = require("node:http");
const { createApp } = require("../dist/app");

const sampleResponse = {
    prediction: { modelo: "naive", fecha_prediccion: "2026-11-11", precio_predicho: 110 },
    market: { symbol: "XMR-USD", rows: [] }
};

let upstream;
let service;
let baseUrl;
let saved;

before(async () => {
    upstream = http.createServer((request, response) => {
        let body = "";
        request.setEncoding("utf8");
        request.on("data", chunk => { body += chunk; });
        request.on("end", () => {
            if (request.url === "/api/v1/predictions" && request.method === "POST") {
                response.writeHead(200, { "content-type": "application/json" });
                response.end(JSON.stringify(sampleResponse));
                return;
            }
            response.writeHead(404);
            response.end();
        });
    });
    await new Promise(resolve => upstream.listen(0, "127.0.0.1", resolve));
    const upstreamUrl = `http://127.0.0.1:${upstream.address().port}`;
    saved = [];
    const store = {
        ensureIndexes: async () => {},
        ping: async () => {},
        save: async (request, response) => saved.push({ request, response }),
        listLatest: async limit => saved.slice(-limit)
    };
    service = createApp(upstreamUrl, store).listen(0, "127.0.0.1");
    await new Promise(resolve => service.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${service.address().port}`;
});

after(async () => {
    await Promise.all([
        new Promise((resolve, reject) => service.close(error => error ? reject(error) : resolve())),
        new Promise((resolve, reject) => upstream.close(error => error ? reject(error) : resolve()))
    ]);
});

test("prediction requests are validated, persisted, and returned unchanged", async () => {
    const response = await fetch(`${baseUrl}/api/v1/predictions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "naive", seed: 1 })
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), sampleResponse);
    assert.deepEqual(saved[0].request, { model: "naive", seed: 1 });
    assert.deepEqual(saved[0].response, sampleResponse);
});

test("invalid prediction requests are rejected", async () => {
    const response = await fetch(`${baseUrl}/api/v1/predictions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "unknown", seed: -1 })
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_prediction_request" });
});

test("prediction history reads from the service-owned store", async () => {
    const response = await fetch(`${baseUrl}/api/v1/predictions/history?limit=1`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        items: [{ request: { model: "naive", seed: 1 }, response: sampleResponse }],
        count: 1
    });
});

test("prediction service exposes request correlation and Prometheus metrics", async () => {
    const response = await fetch(`${baseUrl}/api/v1/predictions/history?limit=1`, {
        headers: { "x-request-id": "prediction-trace-1" }
    });
    assert.equal(response.headers.get("x-request-id"), "prediction-trace-1");

    const metrics = await fetch(`${baseUrl}/metrics`);
    const text = await metrics.text();
    assert.equal(metrics.status, 200);
    const requestMetric = text.split("\n")
        .find(line => line.startsWith("http_requests_total{")
            && line.includes('route="/api/v1/predictions/history"'));
    assert.ok(requestMetric);
    assert.match(requestMetric, /service="prediction-service"/);
});
