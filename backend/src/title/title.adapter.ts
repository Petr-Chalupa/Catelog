import { randomUUID } from "node:crypto";
import { Title } from "./title.model";
import { getDB } from "../db";
import { WatchListItem } from "../watchlist/watchList.model";
import { APIError } from "../middleware/error.middleware";

export async function getTitleById(titleId: string): Promise<Title> {
    const db = getDB();
    const result = await db.collection<Title>("titles").findOne({ id: titleId });
    if (!result) throw new APIError(404, "Title not found");

    return result;
}

function buildTitleSearchQuery(title: Partial<Title>): any[] {
    const ors: any[] = [];

    if (title.externalIds) {
        Object.entries(title.externalIds).forEach(([source, id]) => {
            if (id) ors.push({ [`externalIds.${source}`]: id });
        });
    }

    const titleVariations = new Set<string>();
    if (title.title) titleVariations.add(title.title);
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

export async function upsertTitle(title: Partial<Title>): Promise<Title> {
    const db = getDB();
    const collection = db.collection<Title>("titles");

    const searchQueries = buildTitleSearchQuery(title);
    const filter = title.id
        ? { id: title.id }
        : searchQueries.length > 0
        ? { $or: searchQueries }
        : { title: title.title };
    const update = {
        $set: {
            title: title.title,
            type: title.type || "movie",
            posterImage: title.poster,
            year: title.year,
            externalIds: title.externalIds || {},
            public: title.public ?? false,
            updatedAt: new Date(),
        },
        $setOnInsert: {
            id: title.id || randomUUID(),
            createdAt: new Date(),
        },
    };
    const options = { upsert: true, returnDocument: "after" as const };

    const result = await collection.findOneAndUpdate(filter, update, options);
    if (!result) throw new APIError(500, "Failed to upsert title");

    return result;
}

export async function findLocalTitleMatches(title: Title): Promise<Title[]> {
    const db = getDB();
    const result = await db
        .collection<Title>("titles")
        .find({ public: true, $or: buildTitleSearchQuery(title) })
        .toArray();

    return result;
}

export async function findTitlesForEnrichment(): Promise<Title[]> {
    const db = getDB();
    const result = await db
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

    return result;
}

export async function findPlaceholders(): Promise<Title[]> {
    const db = getDB();
    const result = await db.collection<Title>("titles").find({ public: false }).toArray();

    return result;
}

export async function deleteUnreferencedTitlePlaceholders() {
    const db = getDB();
    const titleColl = db.collection<Title>("titles");
    const itemColl = db.collection<WatchListItem>("watchlist_items");

    const referencedTitleIds = await itemColl.distinct("titleId");

    await titleColl.deleteMany({
        id: { $nin: referencedTitleIds },
        public: false,
    });
}
