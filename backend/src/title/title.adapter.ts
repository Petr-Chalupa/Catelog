import { randomUUID } from "node:crypto";
import { Title } from "./title.model";
import { db } from "../db";
import { WatchListItem } from "../watchlist/watchList.module";

export async function getTitleById(titleId: string): Promise<Title | null> {
    if (!db) return null;

    const collection = db.collection<Title>("titles");
    const result = await collection.findOne({ id: titleId });

    return result;
}

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
        if (!t) return;
        ors.push({ title: t, ...(title.year && { year: title.year }) });
        ors.push({ localizedTitles: { $elemMatch: { $eq: t } }, ...(title.year && { year: title.year }) });
    });

    return ors;
}

export async function upsertTitle(title: Title): Promise<Title | null> {
    if (!db) return null;

    const collection = db.collection<Title>("titles");

    const filter = { public: true, $or: buildTitleSearchQuery(title) };
    const update = {
        $set: {
            ...title,
            directors: title.directors?.slice(0, 5),
            actors: title.actors?.slice(0, 10),
            updatedAt: new Date(),
        },
        $setOnInsert: {
            id: title.id || randomUUID(),
            createdAt: new Date(),
        },
    };
    const options = { upsert: true, returnDocument: "after" as const };
    const result = await collection.findOneAndUpdate(filter, update, options);

    return result;
}

export async function updateTitlePlaceholders() {
    if (!db) return;

    const collection = db.collection<Title>("titles");
    const placeholders = await collection.find({ public: false }).toArray();

    for (const ph of placeholders) {
        const matches = await collection
            .find({ public: true, $or: buildTitleSearchQuery(ph) })
            .project({ id: 1 })
            .toArray();
        const mergeCandidates = matches.map((m) => m.id);

        await collection.updateOne({ id: ph.id }, { $set: { mergeCandidates } });
    }
}

export async function deleteUnreferencedTitlePlaceholders() {
    if (!db) return;

    const titleColl = db.collection<Title>("titles");
    const itemColl = db.collection<WatchListItem>("watchlist_items");

    const referencedTitleIds = await itemColl.distinct("titleId");

    await titleColl.deleteMany({
        id: { $nin: referencedTitleIds },
        public: false,
    });
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
