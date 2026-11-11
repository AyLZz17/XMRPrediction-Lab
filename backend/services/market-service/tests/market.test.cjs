const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const http = require("node:http");
const { createApp } = require("../dist/app");
const { KrakenProviderError } = require("../dist/kraken");

const samplePayload = {
    symbol: "XMR-USD",
    total_count: 2,
    updated_at: "2026-11-10T00:00:00+00:00",
    latest: { date: "2026-11-10", open: 100, high: 120, low: 90, close: 110, volume: 4 },
    change_pct: 10,
    rows: [
        { date: "2026-11-09", open: 90, high: 110, low: 80, close: 100, volume: 3 },
        { date: "2026-11-10", open: 100, high: 120, low: 90, close: 110, volume: 4 }
    ]
};

let upstream;
let service;
let baseUrl;
let saved;
let savedIntraday;
const intradayRows = [
    { timestamp: "2026-11-11T05:30:00.000Z", open: 100, high: 102, low: 99, close: 101, volume: 2 },
    { timestamp: "2026-11-11T05:31:00.000Z", open: 101, high: 103, low: 100, close: 102, volume: 3 }
];

before(async () => {
    upstream = http.createServer((request, response) => {
        if (request.url === "/api/v1/market?limit=2"
            || request.url === "/api/v1/market/refresh") {
            if (request.method === "POST") {
                response.writeHead(200, { "content-type": "application/json" });
                response.end(JSON.stringify(samplePayload));
                return;
            }
            response.writeHead(200, { "content-type": "application/json" });
            response.end(JSON.stringify(samplePayload));
            return;
        }
        response.writeHead(404);
        response.end();
    });
    await new Promise(resolve => upstream.listen(0, "127.0.0.1", resolve));
    const upstreamUrl = `http://127.0.0.1:${upstream.address().port}`;
    saved = [];
    savedIntraday = [];
    const store = {
        ensureIndexes: async () => {},
        ping: async () => {},
        upsert: async (symbol, rows) => { saved.push({ symbol, rows }); },
        listLatest: async (_symbol, limit) => samplePayload.rows.slice(-limit),
        upsertIntraday: async (symbol, interval, rows) => {
            savedIntraday.push({ symbol, interval, rows });
        },
        listIntraday: async (_symbol, _interval, windowStart, windowEnd) =>
            savedIntraday.flatMap(item => item.rows)
                .filter(row => row.timestamp >= windowStart && row.timestamp < windowEnd)
    };
    const intradayProvider = async interval => ({
        source: "Kraken",
        interval,
        window_start: "2026-11-11T05:22:00.000Z",
        window_end: "2026-11-11T05:32:00.000Z",
        updated_at: "2026-11-11T05:32:00.000Z",
        rows: intradayRows
    });
    service = createApp(upstreamUrl, store, intradayProvider).listen(0, "127.0.0.1");
    await new Promise(resolve => service.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${service.address().port}`;
});

after(async () => {
    await Promise.all([
        new Promise((resolve, reject) => service.close(error => error ? reject(error) : resolve())),
        new Promise((resolve, reject) => upstream.close(error => error ? reject(error) : resolve()))
    ]);
});

test("market reads synchronize Mongo-owned candles and retain the daily contract", async () => {
    const response = await fetch(`${baseUrl}/api/v1/market?limit=2`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body.rows, samplePayload.rows);
    assert.equal(body.change_pct, 10);
    assert.equal(saved[0].symbol, "XMR-USD");
    assert.equal(saved[0].rows.length, 2);
});

test("market refresh persists refreshed candles", async () => {
    const response = await fetch(`${baseUrl}/api/v1/market/refresh`, { method: "POST" });
    assert.equal(response.status, 200);
    assert.equal(saved.length, 2);
    assert.equal((await response.json()).latest.date, "2026-11-10");
});

test("invalid market limits are rejected before contacting Monero", async () => {
    const response = await fetch(`${baseUrl}/api/v1/market?limit=5000`);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
        error: "invalid_limit",
        minimum: 1,
        maximum: 3650
    });
});

test("market exposes request correlation and Prometheus metrics", async () => {
    const response = await fetch(`${baseUrl}/api/v1/market?limit=2`, {
        headers: { "x-request-id": "market-trace-1" }
    });
    assert.equal(response.headers.get("x-request-id"), "market-trace-1");

    const metrics = await fetch(`${baseUrl}/metrics`);
    const text = await metrics.text();
    assert.equal(metrics.status, 200);
    const requestMetric = text.split("\n")
        .find(line => line.startsWith("http_requests_total{")
            && line.includes('route="/api/v1/market"'));
    assert.ok(requestMetric);
    assert.match(requestMetric, /service="market-service"/);
});

test("intraday market validates interval, persists Kraken candles, and returns the source", async () => {
    const response = await fetch(`${baseUrl}/api/v1/market/intraday?interval=1m`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.symbol, "XMR-USD");
    assert.equal(body.source, "Kraken");
    assert.equal(body.interval, "1m");
    assert.deepEqual(body.rows, intradayRows);
    assert.equal(savedIntraday[0].symbol, "XMR-USD");
    assert.equal(savedIntraday[0].interval, "1m");
});

test("intraday market rejects unsupported intervals before calling the provider", async () => {
    let called = false;
    const invalidProvider = async () => {
        called = true;
        throw new Error("provider should not run");
    };
    const store = {
        ensureIndexes: async () => {},
        ping: async () => {},
        upsert: async () => {},
        listLatest: async () => [],
        upsertIntraday: async () => {},
        listIntraday: async () => []
    };
    const invalidService = createApp("http://127.0.0.1", store, invalidProvider)
        .listen(0, "127.0.0.1");
    await new Promise(resolve => invalidService.once("listening", resolve));
    const response = await fetch(
        `http://127.0.0.1:${invalidService.address().port}/api/v1/market/intraday?interval=15m`
    );
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
        error: "invalid_interval",
        allowed: ["1m", "5m"]
    });
    assert.equal(called, false);
    await new Promise((resolve, reject) => invalidService.close(error => error ? reject(error) : resolve()));
});

test("intraday market surfaces provider failures with retry guidance", async () => {
    const failingStore = {
        ensureIndexes: async () => {},
        ping: async () => {},
        upsert: async () => {},
        listLatest: async () => [],
        upsertIntraday: async () => {},
        listIntraday: async () => []
    };
    const failingService = createApp(
        "http://127.0.0.1",
        failingStore,
        async () => { throw new KrakenProviderError("rate limited", 60); }
    ).listen(0, "127.0.0.1");
    await new Promise(resolve => failingService.once("listening", resolve));
    const response = await fetch(
        `http://127.0.0.1:${failingService.address().port}/api/v1/market/intraday?interval=5m`
    );
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "60");
    assert.deepEqual(await response.json(), { error: "intraday_provider_unavailable" });
    await new Promise((resolve, reject) => failingService.close(error => error ? reject(error) : resolve()));
});
