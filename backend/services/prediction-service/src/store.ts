import type { Collection, Db, Document } from "mongodb";
import type { PredictionRequest, PredictionResponse } from "./contracts";

export interface StoredPrediction extends Document {
    request: PredictionRequest;
    response: PredictionResponse;
    recordedAt: Date;
}

export interface PredictionStore {
    ensureIndexes(): Promise<void>;
    ping(): Promise<void>;
    save(request: PredictionRequest, response: PredictionResponse): Promise<void>;
    listLatest(limit: number): Promise<Omit<StoredPrediction, "_id">[]>;
}

export class MongoPredictionStore implements PredictionStore {
    constructor(
        private readonly database: Db,
        private readonly predictions: Collection<StoredPrediction>
    ) {
    }

    async ensureIndexes(): Promise<void> {
        await this.predictions.createIndex({
            "response.prediction.modelo": 1,
            "request.seed": 1,
            recordedAt: -1
        });
    }

    async ping(): Promise<void> {
        await this.database.command({ ping: 1 });
    }

    async save(request: PredictionRequest, response: PredictionResponse): Promise<void> {
        await this.predictions.insertOne({
            request,
            response,
            recordedAt: new Date()
        });
    }

    async listLatest(limit: number): Promise<Omit<StoredPrediction, "_id">[]> {
        return this.predictions.find({})
            .sort({ recordedAt: -1 })
            .limit(limit)
            .project<Omit<StoredPrediction, "_id">>({ _id: 0 })
            .toArray();
    }
}
