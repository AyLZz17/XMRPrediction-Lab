import { createApp } from "./app";

const port = Number(process.env.PORT ?? "8080");
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
}

const moneroApiBaseUrl = process.env.MONERO_API_BASE_URL ?? "http://monero-api:8000";
const server = createApp(moneroApiBaseUrl).listen(port, "0.0.0.0", () => {
    console.log(`API gateway listening on port ${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
        server.close(error => {
            if (error) {
                console.error("API gateway shutdown failed", error);
                process.exitCode = 1;
            }
        });
    });
}
