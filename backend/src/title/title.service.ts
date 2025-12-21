import { searchCSFDById } from "./providers/csfd";
import { searchOMDbById } from "./providers/omdb";
import { searchTMDbById } from "./providers/tmdb";
import { findTitlesForEnrichment, updateTitlePlaceholders, upsertTitle } from "./title.adapter";
import { Title, TitleSource } from "./title.model";

export function computeAvgRating(ratings: Partial<Record<TitleSource, number>> = {}): number {
    const filteredValues: number[] = Object.values(ratings).filter((r) => !isNaN(r));
    const avg = filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length;
    return Math.round(avg * 10) / 10; // Round to one decimal place
}

export function mergeTitle(existing: Title, incoming: Title): Title {
    // Merge arrays without duplicates
    const mergeArray = (a?: any[], b?: any[]) => Array.from(new Set([...(a || []), ...(b || [])]));

    // Merge objects
    const mergeObject = <T>(a?: Record<string, T>, b?: Record<string, T>) => ({
        ...(b || {}),
        ...(a || {}), // existing overwrites incoming if conflict
    });

    const merged: Title = {
        ...incoming,
        ...existing, // existing overwrites incoming if conflict
        // explicit merges
        genres: mergeArray(existing.genres, incoming.genres),
        directors: mergeArray(existing.directors, incoming.directors),
        actors: mergeArray(existing.actors, incoming.actors),
        ratings: mergeObject(existing.ratings, incoming.ratings),
        avgRating: computeAvgRating(mergeObject(existing.ratings, incoming.ratings)),
        localizedTitles: mergeObject(existing.localizedTitles, incoming.localizedTitles),
        externalIds: mergeObject(existing.externalIds, incoming.externalIds),
        updatedAt: new Date(),
    };

    return merged;
}

export async function runEnrichmentWorker() {
    console.log("Starting enrichment worker");

    const titles = await findTitlesForEnrichment();

    for (let title of titles) {
        try {
            if (title.externalIds?.tmdb) {
                const tmdbEnrichment = await searchTMDbById(title.externalIds.tmdb, title.type);
                if (tmdbEnrichment) mergeTitle(title, tmdbEnrichment);
            }

            if (title.externalIds?.imdb) {
                const omdbEnrichment = await searchOMDbById(title.externalIds.imdb);
                if (omdbEnrichment) mergeTitle(title, omdbEnrichment);
            }

            if (title.externalIds?.csfd) {
                const csfdEnrichment = await searchCSFDById(title.externalIds.csfd);
                if (csfdEnrichment) mergeTitle(title, csfdEnrichment);
            }

            await upsertTitle(title);
        } catch (err) {
            console.error(`Enrichment failed for ${title.id}`, err);
        }
    }

    await updateTitlePlaceholders();

    console.log(`Enriched ${titles.length} titles`);
}

export function mergeSearchResults(results: Title[]): Title[] {
    const merged: Title[] = [];

    for (const incoming of results) {
        const incomingTitleVariations = new Set<string>([incoming.title]);
        if (incoming.localizedTitles) {
            Object.values(incoming.localizedTitles).forEach((t) => incomingTitleVariations.add(t));
        }

        let existingMatch = merged.find((existing) => {
            const sameImdb = incoming.externalIds?.imdb && existing.externalIds?.imdb === incoming.externalIds.imdb;
            const sameTmdb = incoming.externalIds?.tmdb && existing.externalIds?.tmdb === incoming.externalIds.tmdb;
            if (sameImdb || sameTmdb) return true;

            const yearMatch = incoming.year === existing.year;
            if (!yearMatch) return false;

            const existingTitleVarations = new Set<string>([existing.title]);
            if (existing.localizedTitles) {
                Object.values(existing.localizedTitles).forEach((t) => existingTitleVarations.add(t));
            }
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
