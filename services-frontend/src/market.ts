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

export async function getMarket(limit = 365): Promise<MarketSnapshot> {
    return parseMarketSnapshot(await requestJson(`/api/v1/market?limit=${limit}`));
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

function finiteNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
