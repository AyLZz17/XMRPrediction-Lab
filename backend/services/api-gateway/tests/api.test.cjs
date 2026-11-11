const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const http = require("node:http");
const { createApp } = require("../dist/app");

let upstream;
let upstreamUrl;
let gateway;
let gatewayUrl;

before(async () => {
    upstream = http.createServer((request, response) => {
        if (request.url === "/api/v1/health") {
            response.writeHead(200, { "content-type": "application/json" });
            response.end(JSON.stringify({ status: "ok" }));
            return;
        }

        if (request.url === "/api/v1/market") {
            response.writeHead(206, { "content-type": "application/json" });
            response.end(JSON.stringify({ source: "monero-api" }));
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
    await new Promise(resolve => upstream.listen(0, "127.0.0.1", resolve));
    upstreamUrl = `http://127.0.0.1:${upstream.address().port}`;

    gateway = createApp(upstreamUrl).listen(0, "127.0.0.1");
    await new Promise(resolve => gateway.once("listening", resolve));
    gatewayUrl = `http://127.0.0.1:${gateway.address().port}`;
});

after(async () => {
    await Promise.all([
        new Promise((resolve, reject) => gateway.close(error => error ? reject(error) : resolve())),
        new Promise((resolve, reject) => upstream.close(error => error ? reject(error) : resolve()))
    ]);
});

test("health endpoint reports gateway status", async () => {
    const response = await fetch(`${gatewayUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok", service: "api-gateway" });
});

test("readiness requires the Monero API", async () => {
    const response = await fetch(`${gatewayUrl}/ready`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ready", service: "api-gateway" });
});

test("proxies paths and preserves upstream response status", async () => {
    const response = await fetch(`${gatewayUrl}/api/v1/market`);
    assert.equal(response.status, 206);
    assert.deepEqual(await response.json(), { source: "monero-api" });
});

test("proxies request bodies and preserves upstream response status", async () => {
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
