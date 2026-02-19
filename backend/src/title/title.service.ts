import { searchCSFD, searchCSFDById } from "./providers/csfd.js";
import { searchOMDb, searchOMDbById } from "./providers/omdb.js";
import { mapTitleTypeToTMDB, searchTMDb, searchTMDbById } from "./providers/tmdb.js";
import { findLocalTitleMatches, findPlaceholders, findTitlesForEnrichment, getTitleById, upsertTitle } from "./title.adapter.js";
import { MergeCandidate, Title, TitleSource, TitleType } from "./title.model.js";

export async function runEnrichment() {
    console.log("Starting enrichment worker");

    const publicTitles = await findTitlesForEnrichment();
    for (const title of publicTitles) {
        await refreshTitleMetadata(title.id);
    }

    const placeholders = await findPlaceholders();
    for (const ph of placeholders) {
        await updatePlaceholderMergeCandidates(ph.id);
    }

    console.log(`Enrichment worker finished for: ${publicTitles.length + placeholders.length}`);
}

export async function refreshTitleMetadata(titleId: string) {
    const title = await getTitleById(titleId);
    if (!title || !title.public) return;

    let enriched: Title = { ...title };

    const [tmdbData, omdbData, csfdData] = await Promise.allSettled([
        title.externalIds?.tmdb ? searchTMDbById(title.externalIds.tmdb, mapTitleTypeToTMDB(title.type)) : Promise.resolve(null),
        title.externalIds?.imdb ? searchOMDbById(title.externalIds.imdb) : Promise.resolve(null),
        title.externalIds?.csfd ? searchCSFDById(title.externalIds.csfd) : Promise.resolve(null),
    ]);

    if (tmdbData.status === "fulfilled" && tmdbData.value) {
        enriched = mergeTitle(enriched, tmdbData.value);
    }
    if (omdbData.status === "fulfilled" && omdbData.value) {
        enriched = mergeTitle(enriched, omdbData.value);
    }
    if (csfdData.status === "fulfilled" && csfdData.value) {
        enriched = mergeTitle(enriched, csfdData.value);
    }

    await upsertTitle(enriched);
}

export async function importTitle(externalIds: Record<string, string>, type: TitleType): Promise<Title> {
    const results = await Promise.allSettled([
        externalIds?.tmdb ? searchTMDbById(externalIds.tmdb, mapTitleTypeToTMDB(type)) : Promise.resolve(null),
        externalIds?.imdb ? searchOMDbById(externalIds.imdb) : Promise.resolve(null),
        externalIds?.csfd ? searchCSFDById(externalIds.csfd) : Promise.resolve(null),
    ]);

    const externalMatches = results
        .filter((r): r is PromiseFulfilledResult<Title | null> => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .filter((v): v is Title => v !== null);

    const mergedExternal = mergeSearchResults(externalMatches);

    const title = await upsertTitle(mergedExternal[0]);

    return title;
}

export async function updatePlaceholderMergeCandidates(titleId: string) {
    const title = await getTitleById(titleId);
    if (!title || title.public) return;

    const candidates: MergeCandidate[] = [];

    const localMatches = await findLocalTitleMatches(title);
    candidates.push(
        ...localMatches.map((m) => ({
            internalId: m.id,
            displayData: { titles: m.titles, year: m.year, type: m.type, poster: m.poster },
        })),
    );

    const searchByTitle = Object.values(title.titles)[0];
    const externalResults = await Promise.allSettled([searchTMDb(searchByTitle, true), searchOMDb(searchByTitle), searchCSFD(searchByTitle, true)]);
    const externalMatches = externalResults.filter((r): r is PromiseFulfilledResult<Title[]> => r.status === "fulfilled").flatMap((r) => r.value);

    const mergedExternal = mergeSearchResults(externalMatches);
    mergedExternal.forEach((r) => {
        candidates.push({
            externalIds: { tmdb: r.externalIds.tmdb, imdb: r.externalIds.imdb, csfd: r.externalIds.csfd },
            displayData: { titles: r.titles, year: r.year, type: r.type, poster: r.poster },
        });
    });

    title.mergeCandidates = candidates;
    await upsertTitle(title);
}

export function mergeTitle(existing: Title, incoming: Title): Title {
    const mergeArray = (a?: any[], b?: any[]) => Array.from(new Set([...(a || []), ...(b || [])]));

    const mergeObject = <T>(a?: Record<string, T>, b?: Record<string, T>) => ({
        ...(b || {}),
        ...(a || {}), // existing overwrites incoming if conflict
    });

    const avgRating = (ratings: Partial<Record<TitleSource, number>> = {}): number => {
        const filteredValues = Object.values(ratings).filter((r) => !isNaN(r));
        const avg = filteredValues.length > 0 ? filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length : 0;
        return Math.round(avg * 10) / 10; // Round to one decimal place
    };

    const merged: Title = {
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
        updatedAt: new Date(),
    };

    return merged;
}

export function mergeSearchResults(results: Title[]): Title[] {
    const merged: Title[] = [];

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
