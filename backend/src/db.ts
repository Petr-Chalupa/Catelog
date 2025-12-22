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

    console.log(`Connected to MongoDB: ${dbName}`);
}

export async function closeDB() {
    if (!client) return;

    await client.close();
    client = null;
    db = null;

    console.log("MongoDB connection closed");
}

async function ensureIndexes() {
    if (!db) return;

    const users = db.collection("users");
    await users.createIndex({ id: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });

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

    console.log("DB indexes ensured");
}
