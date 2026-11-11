import {
    intradayCandleSchema,
    type IntradayCandle,
    type IntradayInterval
} from "./contracts";

const krakenOhlcUrl = "https://api.kraken.com/0/public/OHLC";
const requestTimeoutMs = 10_000;
const cacheDurationMs = 15_000;
const intervalMinutes: Record<IntradayInterval, number> = {
    "1m": 1,
    "5m": 5
};

export interface KrakenIntradaySnapshot {
    source: "Kraken";
    interval: IntradayInterval;
    window_start: string;
    window_end: string;
    updated_at: string;
    rows: IntradayCandle[];
}

export class KrakenProviderError extends Error {
    constructor(
        message: string,
        readonly retryAfterSeconds?: number
    ) {
        super(message);
        this.name = "KrakenProviderError";
    }
}

export type IntradayProvider = (interval: IntradayInterval) => Promise<KrakenIntradaySnapshot>;

export function createKrakenIntradayProvider(
    fetcher: typeof fetch = fetch,
    clock: () => Date = () => new Date()
): IntradayProvider {
    const cache = new Map<IntradayInterval, {
        expiresAt: number;
        snapshot: KrakenIntradaySnapshot;
    }>();
    const inFlight = new Map<IntradayInterval, Promise<KrakenIntradaySnapshot>>();

    return async interval => {
        const now = clock();
        const cached = cache.get(interval);
        if (cached && cached.expiresAt > now.getTime()) {
            return cached.snapshot;
        }

        const pending = inFlight.get(interval);
        if (pending) return pending;

        const request = fetchSnapshot(interval, fetcher, now)
            .then(snapshot => {
                cache.set(interval, {
                    expiresAt: now.getTime() + cacheDurationMs,
                    snapshot
                });
                return snapshot;
            })
            .finally(() => inFlight.delete(interval));
        inFlight.set(interval, request);
        return request;
    };
}

async function fetchSnapshot(
    interval: IntradayInterval,
    fetcher: typeof fetch,
    now: Date
): Promise<KrakenIntradaySnapshot> {
    const minutes = intervalMinutes[interval];
    const intervalSeconds = minutes * 60;
    const currentInterval = Math.floor(now.getTime() / (intervalSeconds * 1_000))
        * intervalSeconds;
    const windowSeconds = interval === "1m" ? 10 * 60 : 12 * 60 * 60;
    const windowStart = currentInterval - windowSeconds;
    const url = new URL(krakenOhlcUrl);
    url.searchParams.set("pair", "XMRUSD");
    url.searchParams.set("interval", String(minutes));

    let response: Response;
    try {
        response = await fetcher(url, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(requestTimeoutMs)
        });
    } catch (error) {
        throw new KrakenProviderError(
            error instanceof Error ? error.message : "Kraken request failed"
        );
    }

    if (!response.ok) {
        const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
        throw new KrakenProviderError(
            `Kraken returned HTTP ${response.status}`,
            retryAfter
        );
    }

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        throw new KrakenProviderError("Kraken returned invalid JSON");
    }

    const rows = parseKrakenCandles(payload)
        .filter(candle => {
            const timestampSeconds = Date.parse(candle.timestamp) / 1_000;
            return timestampSeconds >= windowStart
                && timestampSeconds < currentInterval
                && timestampSeconds + intervalSeconds <= now.getTime() / 1_000;
        })
        .sort((left, right) => left.timestamp.localeCompare(right.timestamp));

    if (rows.some(candle =>
        Date.parse(candle.timestamp) / 1_000 % intervalSeconds !== 0
    )) {
        throw new KrakenProviderError("Kraken returned timestamps outside the requested interval");
    }

    if (!rows.length) {
        throw new KrakenProviderError("Kraken returned no completed candles for the requested window");
    }

    for (let index = 1; index < rows.length; index += 1) {
        if (rows[index - 1].timestamp === rows[index].timestamp) {
            throw new KrakenProviderError("Kraken returned duplicate candle timestamps");
        }
    }

    return {
        source: "Kraken",
        interval,
        window_start: new Date(windowStart * 1_000).toISOString(),
        window_end: new Date(currentInterval * 1_000).toISOString(),
        updated_at: now.toISOString(),
        rows
    };
}

function parseKrakenCandles(payload: unknown): IntradayCandle[] {
    if (!isRecord(payload) || !Array.isArray(payload.error) || payload.error.length) {
        const hasRateLimit = isRecord(payload)
            && Array.isArray(payload.error)
            && payload.error.some(error => typeof error === "string" && /rate limit/i.test(error));
        throw new KrakenProviderError(
            hasRateLimit ? "Kraken rate limit exceeded" : "Kraken returned a provider error",
            hasRateLimit ? 60 : undefined
        );
    }

    const result = payload.result;
    if (!isRecord(result)) {
        throw new KrakenProviderError("Kraken returned an invalid OHLC response");
    }

    const candleArrays = Object.entries(result)
        .filter(([key, value]) => key !== "last" && Array.isArray(value));
    if (candleArrays.length !== 1) {
        throw new KrakenProviderError("Kraken returned an unexpected XMR/USD pair response");
    }

    const values = candleArrays[0][1] as unknown[];
    const candles = values.map(value => parseKrakenCandle(value));
    return candles;
}

function parseKrakenCandle(value: unknown): IntradayCandle {
    if (!Array.isArray(value) || value.length < 7) {
        throw new KrakenProviderError("Kraken returned a malformed OHLC candle");
    }

    const timestamp = parseNumber(value[0]);
    const open = parseNumber(value[1]);
    const high = parseNumber(value[2]);
    const low = parseNumber(value[3]);
    const close = parseNumber(value[4]);
    const volume = parseNumber(value[6]);
    if (timestamp === null || !Number.isInteger(timestamp)
        || open === null || high === null || low === null || close === null || volume === null) {
        throw new KrakenProviderError("Kraken returned non-numeric OHLC values");
    }

    const candle = intradayCandleSchema.safeParse({
        timestamp: new Date(timestamp * 1_000).toISOString(),
        open,
        high,
        low,
        close,
        volume
    });
    if (!candle.success) {
        throw new KrakenProviderError("Kraken returned OHLC values outside the market data contract");
    }
    return candle.data;
}

function parseNumber(value: unknown): number | null {
    if (typeof value !== "string" && typeof value !== "number") return null;
    if (typeof value === "string" && value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseRetryAfter(value: string | null): number | undefined {
    if (!value || !/^\d+$/.test(value)) return undefined;
    const seconds = Number(value);
    return seconds > 0 && seconds <= 3_600 ? seconds : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
