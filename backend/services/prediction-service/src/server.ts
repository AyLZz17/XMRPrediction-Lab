import { MongoClient } from "mongodb";
import { logError, logInfo } from "@aylzz/shared-observability";
import { createApp } from "./app";
import { MongoPredictionStore } from "./store";

const mongoUrl = process.env.MONGO_URL;
if (!mongoUrl) {
    throw new Error("MONGO_URL is required");
}

const mongoClient = new MongoClient(mongoUrl);
const port = Number(process.env.PORT ?? "8092");
const moneroApiBaseUrl = process.env.MONERO_API_BASE_URL ?? "http://monero-api:8000";

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
}

async function start(): Promise<void> {
    await mongoClient.connect();
    const database = mongoClient.db("prediction_service");
    const store = new MongoPredictionStore(database, database.collection("predictions"));
    await store.ensureIndexes();

    const server = createApp(moneroApiBaseUrl, store).listen(port, "0.0.0.0", () => {
        logInfo("prediction-service", `Listening on port ${port}`);
    });

    for (const signal of ["SIGINT", "SIGTERM"] as const) {
        process.on(signal, () => {
            server.close(error => {
                if (error) {
                    logError("prediction-service", "Shutdown failed", error);
                    process.exitCode = 1;
                }
                void mongoClient.close();
            });
        });
    }
}

start().catch(error => {
    logError("prediction-service", "Startup failed", error);
    process.exitCode = 1;
});
