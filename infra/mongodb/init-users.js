const adminDb = db.getSiblingDB("admin");

function createIfMissing(username, password, roles, settingName) {
    if (!username || !password) {
        print(`${settingName} is not configured; skipping backup account creation.`);
        return;
    }

    if (adminDb.getUser(username)) {
        print(`MongoDB account ${username} already exists; leaving it unchanged.`);
        return;
    }
    adminDb.createUser({ user: username, pwd: password, roles });
}

createIfMissing(
    process.env.MONGO_MARKET_USER,
    process.env.MONGO_MARKET_PASSWORD,
    [{ role: "readWrite", db: "market_service" }],
    "MONGO_MARKET_USER"
);
createIfMissing(
    process.env.MONGO_PREDICTION_USER,
    process.env.MONGO_PREDICTION_PASSWORD,
    [{ role: "readWrite", db: "prediction_service" }],
    "MONGO_PREDICTION_USER"
);
createIfMissing(
    process.env.MONGO_MARKET_BACKUP_USER,
    process.env.MONGO_MARKET_BACKUP_PASSWORD,
    [{ role: "read", db: "market_service" }],
    "MONGO_MARKET_BACKUP_USER"
);
createIfMissing(
    process.env.MONGO_PREDICTION_BACKUP_USER,
    process.env.MONGO_PREDICTION_BACKUP_PASSWORD,
    [{ role: "read", db: "prediction_service" }],
    "MONGO_PREDICTION_BACKUP_USER"
);
