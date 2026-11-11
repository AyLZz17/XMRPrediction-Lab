const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const http = require("node:http");
const { createApp } = require("../dist/app");

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
    const store = {
        ensureIndexes: async () => {},
        ping: async () => {},
        upsert: async (symbol, rows) => { saved.push({ symbol, rows }); },
        listLatest: async (_symbol, limit) => samplePayload.rows.slice(-limit)
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
