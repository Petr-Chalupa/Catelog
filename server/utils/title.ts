import { getDB } from "./db";
import { Filter, FilterOperators } from "mongodb";
import { mapTitleTypeToTMDB, searchTMDbById } from "./providers/tmdb";
import { searchOMDbById } from "./providers/omdb";
import { searchCSFDById } from "./providers/csfd";

export async function getTitleById(_id: string): Promise<TitleDB | null> {
    const db = getDB();
    return await db.collection<TitleDB>("titles").findOne({ _id: _id });
}

export async function getTitlesByMetadata(filter: {
    externalIds?: Record<TitleSource, string>;
    titles?: Record<string, string>;
    year?: number;
    public: boolean;
}): Promise<TitleDB[]> {
    const db = getDB();
    const ands: Filter<TitleDB>[] = [{ public: filter.public }];
    const ors: FilterOperators<TitleDB>[] = [];

    if (filter.externalIds) {
        if (filter.externalIds.imdb) ors.push({ "externalIds.imdb": filter.externalIds.imdb });
        if (filter.externalIds.tmdb) ors.push({ "externalIds.tmdb": filter.externalIds.tmdb });
        if (filter.externalIds.csfd) ors.push({ "externalIds.csfd": filter.externalIds.csfd });
    }

    if (filter.titles) {
        const titles = new Set(Object.values(filter.titles).filter(Boolean));
        titles.forEach((title) => {
            const query: Filter<TitleDB> = { $text: { $search: `\"${title}\"` } };
            if (filter.year) query.year = filter.year;
            ors.push(query);
        });
    }

    if (ors.length > 0) ands.push({ $or: ors });

    const finalQuery: Filter<TitleDB> = ands.length > 1 ? { $and: ands } : ands[0]!;
    return await db.collection<TitleDB>("titles").find(finalQuery).sort({ updatedAt: -1 }).toArray();
}

export async function getTitleDetails(titleId: string): Promise<TitlePublic> {
    const title = await getTitleById(titleId);
    if (!title) throw createError({ statusCode: 404, statusMessage: "Title not found" });

    const { public: _, updatedAt, ...titlePublic } = title;
    return titlePublic;
}

export async function getTitlesForEnrichment(): Promise<TitleDB[]> {
    const db = getDB();
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return await db
        .collection<TitleDB>("titles")
        .find({
            public: true,
            $or: [
                { updatedAt: { $lt: oneMonthAgo } },
                { "externalIds.imdb": { $exists: false } },
                { "externalIds.tmdb": { $exists: false } },
                { "externalIds.csfd": { $exists: false } },
                { poster: { $exists: false } },
                { year: { $exists: false } },
                { avgRating: { $exists: false } },
                { durationMinutes: { $exists: false } },
                { genres: { $size: 0 } },
                { directors: { $size: 0 } },
                { actors: { $size: 0 } },
            ],
        })
        .toArray();
}

export async function createTitle(data: TitleCreate): Promise<TitleDB> {
    const db = getDB();

    const newTitle: TitleDB = {
        _id: crypto.randomUUID(),
        ...data,
        public: true,
        mergeCandidates: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await db.collection<TitleDB>("titles").insertOne(newTitle);
    if (!result.acknowledged) throw createError({ statusCode: 500, message: "Title could not be created" });

    return newTitle;
}

export async function createTitlePlaceholder(data: TitleCreatePlaceholder): Promise<TitleDB> {
    const db = getDB();

    const newTitle: TitleDB = {
        _id: crypto.randomUUID(),
        ...data,
        public: false,
        genres: [],
        ratings: {},
        directors: [],
        actors: [],
        externalIds: {},
        mergeCandidates: [],
        durationMinutes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await db.collection<TitleDB>("titles").insertOne(newTitle);
    if (!result.acknowledged) throw createError({ statusCode: 500, message: "Title placeholder could not be created" });

    return newTitle;
}

export async function updateTitle(titleId: string, data: TitleUpdate): Promise<TitleDB> {
    const db = getDB();

    const result = await db
        .collection<TitleDB>("titles")
        .findOneAndUpdate({ _id: titleId }, { $set: { ...data, updatedAt: new Date() } }, { returnDocument: "after" });

    if (!result) throw createError({ statusCode: 404, statusMessage: "Title not found" });
    return result;
}

export async function deleteUnreferencedTitlePlaceholders(): Promise<number> {
    const db = getDB();

    const referencedTitleIds = await db.collection<WatchlistItemDB>("watchlist_items").distinct("titleId");
    const result = await db
        .collection<TitleDB>("titles")
        .deleteMany({ public: false, _id: { $nin: referencedTitleIds } });

    return result.deletedCount;
}

export async function importTitle(externalIds: Record<string, string>, type: TitleType): Promise<TitleDB> {
    const existing = await getTitlesByMetadata({ externalIds, public: true });
    if (existing.length > 0) return existing[0]!;

    const results = await Promise.allSettled([
        externalIds.tmdb ? searchTMDbById(externalIds.tmdb, mapTitleTypeToTMDB(type)) : Promise.resolve(null),
        externalIds.imdb ? searchOMDbById(externalIds.imdb) : Promise.resolve(null),
        externalIds.csfd ? searchCSFDById(externalIds.csfd) : Promise.resolve(null),
    ]);

    const titleData = results
        .filter((r): r is PromiseFulfilledResult<TitleCreate | null> => r.status === "fulfilled")
        .map((r) => r.value)
        .filter((v): v is TitleCreate => v !== null);

    if (titleData.length === 0) {
        throw createError({ statusCode: 404, message: "Title metadata not found in external providers" });
    }

    const merged = mergeSearchResults(titleData)[0]!;
    return await createTitle(merged);
}

export async function searchTitles(query: string): Promise<TitleCreate[]> {
    const results = await Promise.allSettled([searchTMDb(query, true), searchOMDb(query), searchCSFD(query, true)]);

    const flattenedResults = results
        .filter((r): r is PromiseFulfilledResult<TitleCreate[]> => r.status === "fulfilled")
        .flatMap((r) => r.value);
    const mergedResults = mergeSearchResults(flattenedResults);

    return mergedResults;
}

export async function refreshTitleMetadata(titleId: string) {
    const title = await getTitleById(titleId);
    if (!title || !title.public) return;

    const results = await Promise.allSettled([
        title.externalIds?.tmdb
            ? searchTMDbById(title.externalIds.tmdb, mapTitleTypeToTMDB(title.type))
            : Promise.resolve(null),
        title.externalIds?.imdb ? searchOMDbById(title.externalIds.imdb) : Promise.resolve(null),
        title.externalIds?.csfd ? searchCSFDById(title.externalIds.csfd) : Promise.resolve(null),
    ]);

    const enriched = results.reduce(
        (acc, result) => {
            if (result.status === "fulfilled" && result.value) {
                return mergeTitle(acc, result.value);
            }
            return acc;
        },
        { ...title } as TitleDB,
    );

    const { _id, createdAt, updatedAt, ...updateData } = enriched;
    await updateTitle(titleId, updateData);
}

export async function updatePlaceholderMergeCandidates(titleId: string) {
    const title = await getTitleById(titleId);
    if (!title || title.public) return;

    const candidates: MergeCandidate[] = [];

    const localMatches = await getTitlesByMetadata({ titles: title.titles, year: title.year, public: true });
    candidates.push(
        ...localMatches.map((m) => ({
            internalId: m._id,
            displayData: { titles: m.titles, year: m.year, type: m.type, poster: m.poster },
        })),
    );

    const searchName = Object.values(title.titles)[0];
    if (searchName) {
        const mergedExternal = await searchTitles(searchName);
        mergedExternal.forEach((r) => {
            const isAlreadyLocal = localMatches.some(
                (m) =>
                    (r.externalIds.imdb && m.externalIds.imdb === r.externalIds.imdb) ||
                    (r.externalIds.tmdb && m.externalIds.tmdb === r.externalIds.tmdb) ||
                    (r.externalIds.csfd && m.externalIds.csfd === r.externalIds.tmdb),
            );
            if (!isAlreadyLocal) {
                candidates.push({
                    externalIds: r.externalIds,
                    displayData: { titles: r.titles, year: r.year, type: r.type, poster: r.poster },
                });
            }
        });
    }

    await updateTitle(titleId, { mergeCandidates: candidates });
}

export function mergeTitle<T extends TitleDB | TitleCreate>(existing: T, incoming: TitleDB | TitleCreate): T {
    const mergeArray = (a?: any[], b?: any[]) => Array.from(new Set([...(a || []), ...(b || [])]));

    const mergeObject = <V>(a?: Record<string, V>, b?: Record<string, V>) => ({
        ...(b || {}),
        ...(a || {}), // existing overwrites incoming if conflict
    });

    const avgRating = (ratings: Partial<Record<TitleSource, number>> = {}): number => {
        const filteredValues = Object.values(ratings).filter((r) => !isNaN(r));
        const avg = filteredValues.length > 0 ? filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length : 0;
        return Math.round(avg * 10) / 10; // Round to one decimal place
    };

    const merged: T = {
        ...incoming,
        ...existing, // existing overwrites incoming if conflict
        // explicit merges
        titles: mergeObject(existing.titles, incoming.titles),
        genres: mergeArray(existing.genres, incoming.genres),
        directors: mergeArray(existing.directors, incoming.directors),
        actors: mergeArray(existing.actors, incoming.actors),
        ratings: mergeObject(existing.ratings, incoming.ratings),
        avgRating: avgRating(mergeObject(existing.ratings, incoming.ratings)),
        externalIds: mergeObject(existing.externalIds, incoming.externalIds),
        ...("updatedAt" in existing ? { updatedAt: new Date() } : {}),
    };

    return merged;
}

export function mergeSearchResults(results: TitleCreate[]): TitleCreate[] {
    const merged: TitleCreate[] = [];

    for (const incoming of results) {
        const incomingTitleVariations = new Set<string>();
        Object.values(incoming.titles).forEach((t) => incomingTitleVariations.add(t));

        let existingMatch = merged.find((existing) => {
            const sameImdb = incoming.externalIds?.imdb && existing.externalIds?.imdb === incoming.externalIds.imdb;
            const sameTmdb = incoming.externalIds?.tmdb && existing.externalIds?.tmdb === incoming.externalIds.tmdb;
            if (sameImdb || sameTmdb) return true;

            const yearMatch = incoming.year === existing.year;
            if (!yearMatch) return false;

            const existingTitleVarations = new Set<string>();
            Object.values(existing.titles).forEach((t) => existingTitleVarations.add(t));

            return [...incomingTitleVariations].some((name) => existingTitleVarations.has(name));
        });

        if (existingMatch) {
            Object.assign(existingMatch, mergeTitle(existingMatch, incoming));
        } else {
            merged.push(incoming);
        }
    }

    return merged;
}
