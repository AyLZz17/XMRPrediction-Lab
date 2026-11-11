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

export type OhlcvRow = z.infer<typeof ohlcvRowSchema>;
export type MarketResponse = z.infer<typeof marketResponseSchema>;
