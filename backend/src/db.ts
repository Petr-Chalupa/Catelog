import { Db, MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { mergeTitle, Title } from "./models/Title";

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

function buildTitleSearchQuery(title: Title): any[] {
    const ors: any[] = [];

    if (title.externalIds) {
        Object.entries(title.externalIds).forEach(([source, id]) => {
            if (id) ors.push({ [`externalIds.${source}`]: id });
        });
    }

    const titleVariations = new Set<string>([title.title]);
    if (title.localizedTitles) {
        Object.values(title.localizedTitles).forEach((val) => titleVariations.add(val));
    }
    titleVariations.forEach((t) => {
        ors.push({ title: t, ...(title.year && { year: title.year }) });
        ors.push({ localizedTitles: { $elemMatch: { $eq: t } }, ...(title.year && { year: title.year }) });
    });

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
            id: title.id || randomUUID(),
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
