import { Db, MongoClient } from "mongodb";
import { mergeTitle, Title } from "./models/Title";
import { v4 as uuidv4 } from "uuid";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB() {
    if (db) return;

    const uri = process.env.MONGO_URI || "";
    const dbName = process.env.MONGO_DB || "";

    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);

    const titles = db.collection<Title>("titles");
    await titles.createIndexes([
        { key: { id: 1 }, unique: true },
        { key: { title: 1, year: 1, public: 1 } },
        { key: { avgRating: -1 } },
    ]);

    console.log(`Connected to MongoDB: ${dbName}`);
}

export async function closeDB() {
    if (!client) return;

    await client.close();
    client = null;
    db = null;

    console.log("MongoDB connection closed");
}

// --------------- Title adapter ---------------

function buildTitleSearchQuery(title: Title): Record<string, string>[] {
    const ors = [];

    if (title.externalIds) {
        for (const [source, id] of Object.entries(title.externalIds)) {
            ors.push({ [`externalIds.${source}`]: id });
        }
    }

    ors.push({ title: title.title });

    if (title.localizedTitles) {
        for (const [lang, localizedTitle] of Object.entries(title.localizedTitles)) {
            if (!localizedTitle) continue;
            ors.push({ title: localizedTitle });
            ors.push({ [`localizedTitles.${lang}`]: title.title });
            ors.push({ [`localizedTitles.${lang}`]: localizedTitle });
        }
    }

    return ors;
}

export async function upsertTitle(title: Title): Promise<Title | null> {
    if (!db) return null;

    const collection = db.collection<Title>("titles");
    const existing = await collection.findOne({ public: true, $or: buildTitleSearchQuery(title) });

    if (existing) {
        const merged = mergeTitle(existing, title);
        await collection.replaceOne({ id: merged.id }, merged);
        return merged;
    } else {
        const newTitle: Title = {
            ...title,
            id: title.id || uuidv4(),
            updatedAt: new Date(),
            createdAt: new Date(),
        };
        await collection.insertOne(newTitle);
        return newTitle;
    }
}

export async function updateTitlePlaceholders() {
    if (!db) return;

    const collection = db.collection<Title>("titles");
    const placeholders = await collection.find({ public: false }).toArray();

    for (const ph of placeholders) {
        const matches = await collection.find({ public: true, $or: buildTitleSearchQuery(ph) }).toArray();

        ph.mergeCandidates = [];
        for (const match of matches) {
            ph.mergeCandidates.push(match.id);
        }

        await collection.replaceOne({ id: ph.id }, ph);
    }
}

export async function findTitlesForEnrichment(): Promise<Title[]> {
    if (!db) return [];

    return db
        .collection<Title>("titles")
        .find({
            public: true,
            $or: [
                { avgRating: { $exists: false } },
                { poster: { $exists: false } },
                { localizedTitles: { $exists: false } },
                { updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            ],
        })
        .toArray();
}
