const adminDb = db.getSiblingDB("admin");

adminDb.createUser({
    user: process.env.MONGO_MARKET_USER,
    pwd: process.env.MONGO_MARKET_PASSWORD,
    roles: [{ role: "readWrite", db: "market_service" }]
});

adminDb.createUser({
    user: process.env.MONGO_PREDICTION_USER,
    pwd: process.env.MONGO_PREDICTION_PASSWORD,
    roles: [{ role: "readWrite", db: "prediction_service" }]
});
