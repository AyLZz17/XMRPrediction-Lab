import type { Collection, Db, Document } from "mongodb";
import type { MarketResponse, OhlcvRow } from "./contracts";

interface StoredCandle extends OhlcvRow, Document {
    symbol: string;
    ingestedAt: Date;
}

export interface MarketStore {
    ensureIndexes(): Promise<void>;
    ping(): Promise<void>;
    upsert(symbol: string, rows: OhlcvRow[]): Promise<void>;
    listLatest(symbol: string, limit: number): Promise<OhlcvRow[]>;
}

export class MongoMarketStore implements MarketStore {
    constructor(
        private readonly database: Db,
        private readonly candles: Collection<StoredCandle>
    ) {
    }

    async ensureIndexes(): Promise<void> {
        await this.candles.createIndex({ symbol: 1, date: 1 }, { unique: true });
    }

    async ping(): Promise<void> {
        await this.database.command({ ping: 1 });
    }

    async upsert(symbol: string, rows: OhlcvRow[]): Promise<void> {
        if (rows.length === 0) {
            return;
        }

        await this.candles.bulkWrite(rows.map(row => ({
            updateOne: {
                filter: { symbol, date: row.date },
                update: {
                    $set: { ...row, symbol, ingestedAt: new Date() }
                },
                upsert: true
            }
        })), { ordered: false });
    }

    async listLatest(symbol: string, limit: number): Promise<OhlcvRow[]> {
        const rows = await this.candles.find({ symbol })
            .sort({ date: -1 })
            .limit(limit)
            .project<OhlcvRow>({
                _id: 0,
                date: 1,
                open: 1,
                high: 1,
                low: 1,
                close: 1,
                volume: 1
            })
            .toArray();
        return rows.reverse();
    }
}

export function marketResponseFromStoredRows(
    source: MarketResponse,
    rows: OhlcvRow[]
): MarketResponse {
    if (rows.length === 0) {
        throw new Error("Market store returned no candles after a successful synchronization");
    }
    const latest = rows[rows.length - 1];
    const previousClose = rows.length > 1 ? rows[rows.length - 2].close : latest.close;
    const changePct = previousClose === 0
        ? 0
        : ((latest.close - previousClose) / previousClose) * 100;
    return {
        ...source,
        latest,
        rows,
        change_pct: Math.round(changePct * 10_000) / 10_000
    };
}
