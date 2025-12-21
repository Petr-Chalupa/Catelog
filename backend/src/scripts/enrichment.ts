import { upsertTitle, findTitlesForEnrichment, updateTitlePlaceholders } from "../db";
import { mergeTitle } from "../models/Title";
import { fetchTMDbDetails } from "./tmdb";
import { searchOMDbById } from "./omdb";
import { fetchCSFDDetails } from "./csfd";

export async function runEnrichmentWorker() {
    console.log("Starting enrichment worker");

    const titles = await findTitlesForEnrichment();

    for (let title of titles) {
        try {
            if (title.externalIds?.tmdb) {
                const tmdbEnrichment = await fetchTMDbDetails(title.externalIds.tmdb, title.type);
                if (tmdbEnrichment) mergeTitle(title, tmdbEnrichment);
            }

            if (title.externalIds?.imdb) {
                const omdbEnrichment = await searchOMDbById(title.externalIds.imdb);
                if (omdbEnrichment) mergeTitle(title, omdbEnrichment);
            }

            if (title.externalIds?.csfd) {
                const csfdEnrichment = await fetchCSFDDetails(title.externalIds.csfd);
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
