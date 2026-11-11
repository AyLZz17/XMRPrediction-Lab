import { z } from "zod";

export const ohlcvRowSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    open: z.number().finite(),
    high: z.number().finite(),
    low: z.number().finite(),
    close: z.number().finite(),
    volume: z.number().finite()
});

export const marketResponseSchema = z.object({
    symbol: z.string().min(1),
    total_count: z.number().int().nonnegative(),
    updated_at: z.string().datetime({ offset: true }),
    latest: ohlcvRowSchema,
    change_pct: z.number().finite(),
    rows: z.array(ohlcvRowSchema).min(1)
});

export const intradayIntervalSchema = z.enum(["1m", "5m"]);

export const intradayCandleSchema = z.object({
    timestamp: z.string().datetime(),
    open: z.number().finite().positive(),
    high: z.number().finite().positive(),
    low: z.number().finite().positive(),
    close: z.number().finite().positive(),
    volume: z.number().finite().nonnegative()
}).refine(candle => candle.high >= Math.max(candle.open, candle.close)
    && candle.low <= Math.min(candle.open, candle.close), {
    message: "Intraday OHLC values are inconsistent"
});

export const intradayMarketResponseSchema = z.object({
    symbol: z.literal("XMR-USD"),
    source: z.literal("Kraken"),
    interval: intradayIntervalSchema,
    window_start: z.string().datetime(),
    window_end: z.string().datetime(),
    updated_at: z.string().datetime(),
    rows: z.array(intradayCandleSchema).min(1)
}).superRefine((snapshot, context) => {
    const intervalMilliseconds = snapshot.interval === "1m" ? 60_000 : 300_000;
    const expectedWindowMilliseconds = snapshot.interval === "1m"
        ? 10 * 60_000
        : 12 * 60 * 60_000;
    const windowStart = Date.parse(snapshot.window_start);
    const windowEnd = Date.parse(snapshot.window_end);
    if (windowEnd - windowStart !== expectedWindowMilliseconds) {
        context.addIssue({
            code: "custom",
            message: "Intraday window length does not match the selected interval",
            path: ["window_end"]
        });
    }

    snapshot.rows.forEach((row, index) => {
        const timestamp = Date.parse(row.timestamp);
        if (timestamp < windowStart || timestamp >= windowEnd
            || timestamp % intervalMilliseconds !== 0
            || (index > 0 && Date.parse(snapshot.rows[index - 1].timestamp) >= timestamp)) {
            context.addIssue({
                code: "custom",
                message: "Intraday candles must be ordered within the requested UTC window",
                path: ["rows", index, "timestamp"]
            });
        }
    });
});

export type OhlcvRow = z.infer<typeof ohlcvRowSchema>;
export type MarketResponse = z.infer<typeof marketResponseSchema>;
export type IntradayInterval = z.infer<typeof intradayIntervalSchema>;
export type IntradayCandle = z.infer<typeof intradayCandleSchema>;
export type IntradayMarketResponse = z.infer<typeof intradayMarketResponseSchema>;
