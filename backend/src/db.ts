import { Db, MongoClient } from "mongodb";

export let client: MongoClient | null = null;
export let db: Db | null = null;

export async function connectDB() {
    if (db) return;

    const uri = process.env.MONGO_URI || "";
    const dbName = process.env.MONGO_DB || "";

    client = new MongoClient(uri);
    await client.connect();

    db = client.db(dbName);
    await ensureIndexes();
    await deleteExpired();

    console.log(`Connected to MongoDB: ${dbName}`);
}

export async function closeDB() {
    if (!client) return;

    await client.close();
    client = null;
    db = null;

    console.log("MongoDB connection closed");
}

export async function ensureIndexes() {
    if (!db) return;

    const users = db.collection("users");
    await users.createIndex({ id: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });

    const oauthSessions = db.collection("oauth_sessions");
    await oauthSessions.createIndex({ state: 1 }, { unique: true });

    const refreshTokens = db.collection("refresh_tokens");
    await refreshTokens.createIndex({ token: 1 }, { unique: true });

    const userDevices = db.collection("user_devices");
    await userDevices.createIndex({ id: 1 }, { unique: true });
    await userDevices.createIndex({ userId: 1 });

    const titles = db.collection("titles");
    await titles.createIndex({ id: 1 }, { unique: true });
    await titles.createIndex({ title: 1 });
    await titles.createIndex({ "externalIds.tmdb": 1 });
    await titles.createIndex({ "externalIds.imdb": 1 });
    await titles.createIndex({ "externalIds.csfd": 1 });

    const watchlists = db.collection("watchlists");
    await watchlists.createIndex({ id: 1 }, { unique: true });
    await watchlists.createIndex({ ownerId: 1 });
    await watchlists.createIndex({ sharedWith: 1 });

    const watchlistItems = db.collection("watchlist_items");
    await watchlistItems.createIndex({ id: 1 }, { unique: true });
    await watchlistItems.createIndex({ listId: 1 });
    await watchlistItems.createIndex({ titleId: 1 });

    const invites = db.collection("invites");
    await invites.createIndex({ token: 1 }, { unique: true });
}

export async function deleteExpired() {
    if (!db) return;

    const indexName = "expiresAt_1";
    const configs = [
        { col: "oauth_sessions", ttl: 60 * 60 * 24 }, // 1 Day
        { col: "refresh_tokens", ttl: 30 * 24 * 60 * 60 }, // 30 Days
        { col: "invites", ttl: 30 * 24 * 60 * 60 }, // 30 Days
    ];

    for (const { col, ttl } of configs) {
        const collection = db.collection(col);
        const indexes = await collection.listIndexes().toArray();
        const existingTTLIndex = indexes.find((idx) => idx.name === indexName);

        if (existingTTLIndex && existingTTLIndex.expireAfterSeconds !== ttl) {
            await collection.dropIndex(indexName);
            console.log(`Updating TTL index for ${col} to ${ttl}s...`);
        } else if (!existingTTLIndex) {
            console.log(`Creating new TTL index for ${col}...`);
        }

        await collection.createIndex({ expiresAt: 1 }, { name: indexName, expireAfterSeconds: ttl });
    }
}
