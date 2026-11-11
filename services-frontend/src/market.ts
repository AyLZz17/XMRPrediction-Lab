import { isRecord, requestJson } from "./http";

export interface Candle {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface MarketSnapshot {
    symbol: "XMR-USD";
    total_count: number;
    updated_at: string;
    latest: Candle;
    change_pct: number;
    rows: Candle[];
}

export type IntradayInterval = "1m" | "5m";

export interface IntradayCandle {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface IntradayMarketSnapshot {
    symbol: "XMR-USD";
    source: "Kraken";
    interval: IntradayInterval;
    window_start: string;
    window_end: string;
    updated_at: string;
    rows: IntradayCandle[];
}

export async function getMarket(limit = 365): Promise<MarketSnapshot> {
    return parseMarketSnapshot(await requestJson(`/api/v1/market?limit=${limit}`));
}

export async function getIntradayMarket(
    interval: IntradayInterval,
    signal?: AbortSignal
): Promise<IntradayMarketSnapshot> {
    const requestSignal = signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
        : AbortSignal.timeout(20_000);
    return parseIntradayMarketSnapshot(await requestJson(
        `/api/v1/market/intraday?interval=${interval}`,
        { signal: requestSignal }
    ));
}

export async function refreshMarket(): Promise<MarketSnapshot> {
    return parseMarketSnapshot(await requestJson("/api/v1/market/refresh", { method: "POST" }));
}

export function parseMarketSnapshot(value: unknown): MarketSnapshot {
    if (!isRecord(value) || value.symbol !== "XMR-USD"
        || typeof value.total_count !== "number" || !Number.isInteger(value.total_count)
        || typeof value.updated_at !== "string" || !Number.isFinite(Date.parse(value.updated_at))
        || typeof value.change_pct !== "number" || !Array.isArray(value.rows)) {
        throw new Error("The market service returned an invalid XMR-USD response.");
    }

    const rows = value.rows.map(parseCandle);
    if (!rows.length) throw new Error("The market service returned no daily candles.");
    const latest = parseCandle(value.latest);
    if (latest.date !== rows[rows.length - 1].date) {
        throw new Error("The latest market candle does not match the returned history.");
    }
    return {
        symbol: "XMR-USD",
        total_count: value.total_count,
        updated_at: value.updated_at,
        latest,
        change_pct: value.change_pct,
        rows
    };
}

export function parseIntradayMarketSnapshot(value: unknown): IntradayMarketSnapshot {
    if (!isRecord(value) || value.symbol !== "XMR-USD" || value.source !== "Kraken"
        || (value.interval !== "1m" && value.interval !== "5m")
        || typeof value.window_start !== "string"
        || !Number.isFinite(Date.parse(value.window_start))
        || typeof value.window_end !== "string"
        || !Number.isFinite(Date.parse(value.window_end))
        || typeof value.updated_at !== "string"
        || !isUtcTimestamp(value.updated_at)
        || !Array.isArray(value.rows)) {
        throw new Error("The market service returned an invalid intraday response.");
    }

    const intervalMilliseconds = value.interval === "1m" ? 60_000 : 300_000;
    const windowStart = Date.parse(value.window_start);
    const windowEnd = Date.parse(value.window_end);
    const expectedWindow = value.interval === "1m" ? 10 * 60_000 : 12 * 60 * 60_000;
    if (!isUtcTimestamp(value.window_start) || !isUtcTimestamp(value.window_end)
        || windowEnd - windowStart !== expectedWindow) {
        throw new Error("The market service returned an invalid intraday window.");
    }

    const rows = value.rows.map(parseIntradayCandle);
    if (!rows.length) throw new Error("The market service returned no intraday candles.");
    for (let index = 1; index < rows.length; index += 1) {
        if (Date.parse(rows[index - 1].timestamp) >= Date.parse(rows[index].timestamp)) {
            throw new Error("The market service returned unordered intraday candles.");
        }
    }
    if (rows.some(row => {
        const timestamp = Date.parse(row.timestamp);
        return timestamp < windowStart || timestamp >= windowEnd
            || timestamp % intervalMilliseconds !== 0;
    })) {
        throw new Error("The market service returned candles outside the requested intraday window.");
    }

    return {
        symbol: "XMR-USD",
        source: "Kraken",
        interval: value.interval,
        window_start: value.window_start,
        window_end: value.window_end,
        updated_at: value.updated_at,
        rows
    };
}

function parseCandle(value: unknown): Candle {
    if (!isRecord(value) || typeof value.date !== "string"
        || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
        throw new Error("The market service returned an invalid daily candle.");
    }
    const open = finiteNumber(value.open);
    const high = finiteNumber(value.high);
    const low = finiteNumber(value.low);
    const close = finiteNumber(value.close);
    const volume = finiteNumber(value.volume);
    if (open === null || high === null || low === null || close === null || volume === null) {
        throw new Error("The market service returned an invalid daily candle.");
    }
    return {
        date: value.date,
        open,
        high,
        low,
        close,
        volume
    };
}

function parseIntradayCandle(value: unknown): IntradayCandle {
    if (!isRecord(value) || typeof value.timestamp !== "string"
        || !isUtcTimestamp(value.timestamp)) {
        throw new Error("The market service returned an invalid intraday candle.");
    }
    const open = finiteNumber(value.open);
    const high = finiteNumber(value.high);
    const low = finiteNumber(value.low);
    const close = finiteNumber(value.close);
    const volume = finiteNumber(value.volume);
    if (open === null || high === null || low === null || close === null || volume === null
        || open <= 0 || high <= 0 || low <= 0 || close <= 0 || volume < 0
        || high < Math.max(open, close) || low > Math.min(open, close)) {
        throw new Error("The market service returned an invalid intraday candle.");
    }
    return {
        timestamp: value.timestamp,
        open,
        high,
        low,
        close,
        volume
    };
}

function isUtcTimestamp(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
        return false;
    }
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function finiteNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
