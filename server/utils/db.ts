import dns from "dns";
import { Db, MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const config = useRuntimeConfig();
const clientInstance = new MongoClient(config.MONGO_URI);
const dbInstance = clientInstance.db(config.MONGO_DB);

export function getDB(): Db {
    return dbInstance;
}

export async function connectDB() {
    await clientInstance.connect();
    await ensureIndexes();
    await deleteExpired();
}

export async function closeDB() {
    if (!clientInstance) return;
    await clientInstance.close();
}

export async function ensureIndexes() {
    const db = getDB();

    const users = db.collection("users");
    await users.createIndex({ email: 1 }, { unique: true });

    const userDevices = db.collection("user_devices");
    await userDevices.createIndex({ userId: 1 });

    const titles = db.collection("titles");
    await titles.createIndex({ titles: "text" });
    await titles.createIndex({ "externalIds.tmdb": 1 });
    await titles.createIndex({ "externalIds.imdb": 1 });
    await titles.createIndex({ "externalIds.csfd": 1 });

    const watchlists = db.collection("watchlists");
    await watchlists.createIndex({ ownerId: 1 });
    await watchlists.createIndex({ sharedWith: 1 });

    const watchlistItems = db.collection("watchlist_items");
    await watchlistItems.createIndex({ listId: 1 });
    await watchlistItems.createIndex({ titleId: 1 });

    const invites = db.collection("invites");
    await invites.createIndex({ token: 1 }, { unique: true });
}

export async function deleteExpired() {
    const db = getDB();

    const indexName = "expiresAt_1";
    const configs = [
        { col: "invites", ttl: 30 * 24 * 60 * 60 }, // 30 Days
    ];

    for (const { col, ttl } of configs) {
        const collection = db.collection(col);
        const indexes = await collection.listIndexes().toArray();
        const existingTTLIndex = indexes.find((idx) => idx.name === indexName);

        if (existingTTLIndex && existingTTLIndex.expireAfterSeconds !== ttl) {
            await collection.dropIndex(indexName);
            LOG({ level: "INFO", message: `Updating TTL index for ${col} to ${ttl}s...` });
        } else if (!existingTTLIndex) {
            LOG({ level: "INFO", message: `Creating new TTL index for ${col}...` });
        }

        await collection.createIndex({ expiresAt: 1 }, { name: indexName, expireAfterSeconds: ttl });
    }
}
