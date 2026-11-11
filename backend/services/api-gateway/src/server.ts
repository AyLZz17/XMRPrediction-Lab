import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { createApp } from "./app";

const port = Number(process.env.PORT ?? "8080");
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    throw new Error("REDIS_URL is required");
}

const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false
});
redis.on("error", error => console.error("API gateway Redis connection error", error));

const rateLimiters = {
    api: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "gateway:api",
        points: 120,
        duration: 60,
        blockDuration: 60
    }),
    auth: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "gateway:auth",
        points: 10,
        duration: 60,
        blockDuration: 300
    }),
    pingRedis: async () => {
        await redis.ping();
    }
};

const server = createApp({
    moneroApiBaseUrl: process.env.MONERO_API_BASE_URL ?? "http://monero-api:8000",
    securityServiceBaseUrl: process.env.SECURITY_SERVICE_BASE_URL ?? "http://security-service:8081",
    marketServiceBaseUrl: process.env.MARKET_SERVICE_BASE_URL ?? "http://market-service:8090",
    predictionServiceBaseUrl: process.env.PREDICTION_SERVICE_BASE_URL
        ?? "http://prediction-service:8092",
    rateLimiters
}).listen(port, "0.0.0.0", () => {
    console.log(`API gateway listening on port ${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
        server.close(error => {
            if (error) {
                console.error("API gateway shutdown failed", error);
                process.exitCode = 1;
            }
            void redis.quit().catch(redisError => {
                console.error("API gateway Redis shutdown failed", redisError);
                process.exitCode = 1;
            });
        });
    });
}
