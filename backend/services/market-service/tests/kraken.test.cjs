const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createKrakenIntradayProvider } = require("../dist/kraken");

function krakenRow(timestamp) {
    return [timestamp, "100", "102", "99", "101", "100.5", "2.5", 4];
}

function krakenResponse(rows) {
    return new Response(JSON.stringify({
        error: [],
        result: { XXMRZUSD: rows, last: "123" }
    }), { status: 200, headers: { "content-type": "application/json" } });
}

test("Kraken adapter maps 1m data to UTC and excludes the open candle", async () => {
    const now = new Date("2026-11-11T12:00:30.000Z");
    const start = Date.parse("2026-11-11T11:50:00.000Z") / 1_000;
    const rows = Array.from({ length: 11 }, (_value, index) => krakenRow(start + index * 60));
    let requestUrl;
    const provider = createKrakenIntradayProvider(async url => {
        requestUrl = new URL(url);
        return krakenResponse(rows);
    }, () => now);

    const snapshot = await provider("1m");
    assert.equal(requestUrl.searchParams.get("pair"), "XMRUSD");
    assert.equal(requestUrl.searchParams.get("interval"), "1");
    assert.equal(snapshot.source, "Kraken");
    assert.equal(snapshot.rows.length, 10);
    assert.equal(snapshot.rows[0].timestamp, "2026-11-11T11:50:00.000Z");
    assert.equal(snapshot.rows.at(-1).timestamp, "2026-11-11T11:59:00.000Z");
    assert.equal(snapshot.window_start, "2026-11-11T11:50:00.000Z");
    assert.equal(snapshot.window_end, "2026-11-11T12:00:00.000Z");
});

test("Kraken adapter keeps only the last twelve hours for 5m candles", async () => {
    const now = new Date("2026-11-11T12:00:30.000Z");
    const start = Date.parse("2026-11-11T00:00:00.000Z") / 1_000;
    const rows = Array.from({ length: 145 }, (_value, index) => krakenRow(start + index * 300));
    const provider = createKrakenIntradayProvider(
        async () => krakenResponse(rows),
        () => now
    );

    const snapshot = await provider("5m");
    assert.equal(snapshot.rows.length, 144);
    assert.equal(snapshot.rows[0].timestamp, "2026-11-11T00:00:00.000Z");
    assert.equal(snapshot.rows.at(-1).timestamp, "2026-11-11T11:55:00.000Z");
});

test("Kraken adapter caches requests briefly and rejects invalid OHLCV", async () => {
    const now = new Date("2026-11-11T12:00:30.000Z");
    let requestCount = 0;
    const cachedProvider = createKrakenIntradayProvider(async () => {
        requestCount += 1;
        const start = Date.parse("2026-11-11T11:50:00.000Z") / 1_000;
        return krakenResponse(Array.from({ length: 10 }, (_value, index) => krakenRow(start + index * 60)));
    }, () => now);
    await Promise.all([cachedProvider("1m"), cachedProvider("1m")]);
    assert.equal(requestCount, 1);

    const invalidProvider = createKrakenIntradayProvider(
        async () => krakenResponse([[Date.parse("2026-11-11T11:59:00.000Z") / 1_000, "100", "99", "98", "101", "100", "2", 4]]),
        () => now
    );
    await assert.rejects(() => invalidProvider("1m"), /OHLC values outside the market data contract/);
});
