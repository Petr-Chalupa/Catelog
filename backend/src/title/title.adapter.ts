import { randomUUID } from "node:crypto";
import { Filter } from "mongodb";
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

function buildTitleSearchQuery(title: Partial<Title>, enableTitleVars: boolean): any[] {
    const ors: any[] = [];

    if (title.id) {
        ors.push({ id: title.id });
    }

    if (title.externalIds) {
        Object.entries(title.externalIds).forEach(([source, id]) => {
            if (id) ors.push({ [`externalIds.${source}`]: id });
        });
    }

    if (enableTitleVars && title.titles) {
        const uniqueNames = new Set(Object.values(title.titles).filter(Boolean));

        if (title.year) {
            uniqueNames.forEach((name) => {
                ors.push({ $text: { $search: `\"${name}\"` }, year: title.year });
            });
        }

        uniqueNames.forEach((name) => {
            ors.push({ $text: { $search: `\"${name}\"` } });
        });
    }

    return ors;
}

export async function upsertTitle(title: Partial<Title>): Promise<Title> {
    const db = getDB();
    const collection = db.collection<Title>("titles");

    const searchQueries = buildTitleSearchQuery(title, false);
    const filter = searchQueries.length > 0 ? { $or: searchQueries } : { titles: title.titles };

    const update = {
        $set: {
            titles: title.titles ?? {},
            type: title.type,
            poster: title.poster,
            year: title.year,
            public: title.public ?? false,
            genres: title.genres ?? [],
            ratings: title.ratings ?? {},
            avgRating: title.avgRating,
            directors: title.directors ?? [],
            actors: title.actors ?? [],
            durationMinutes: title.durationMinutes,
            externalIds: title.externalIds || {},
            mergeCandidates: title.mergeCandidates || [],
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
        .find({ public: true, $or: buildTitleSearchQuery(title, true) })
        .sort({ year: -1 })
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
                { poster: { $exists: false } },
                { poster: { $in: [null, ""] } },
                { year: { $exists: false } },
                { year: null },
                { genres: { $size: 0 } },
                { ratings: {} },
                { "ratings.imdb": { $exists: false } },
                { "ratings.imdb": null },
                { "ratings.tmdb": { $exists: false } },
                { "ratings.tmdb": null },
                { "ratings.csfd": { $exists: false } },
                { "ratings.csfd": null },
                { avgRating: { $exists: false } },
                { avgRating: null },
                { directors: { $size: 0 } },
                { actors: { $size: 0 } },
                { durationMinutes: { $exists: false } },
                { durationMinutes: null },
                { externalIds: {} },
                { "externalIds.imdb": { $exists: false } },
                { "externalIds.imdb": { $in: [null, ""] } },
                { "externalIds.tmdb": { $exists: false } },
                { "externalIds.tmdb": { $in: [null, ""] } },
                { "externalIds.csfd": { $exists: false } },
                { "externalIds.csfd": { $in: [null, ""] } },
                { updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            ],
        } as Filter<Title>)
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
