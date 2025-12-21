import axios, { AxiosInstance } from "axios";
import { randomUUID } from "node:crypto";
import { csfd } from "node-csfd-api";
import { upsertTitle, findTitlesForEnrichment, updateTitlePlaceholders } from "../db";
import { Title, TitleGenre, TitleType, mergeTitle } from "../models/Title";

const TMDB_BASE_URL = process.env.TMDB_BASE_URL;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_BASE_URL || !TMDB_API_KEY) throw new Error("TMDB env variable(s) not set");

const OMDB_BASE_URL = process.env.OMDB_BASE_URL;
const OMDB_API_KEY = process.env.OMDB_API_KEY;
if (!OMDB_BASE_URL || !OMDB_API_KEY) throw new Error("OMDB env variable(s) not set");

// --------------- Shared ---------------

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

// --------------- TMDb ---------------

const tmdbClient: AxiosInstance = axios.create({
    baseURL: TMDB_BASE_URL,
    params: { api_key: TMDB_API_KEY },
});

function mapTMDbToTitle(data: any, translations?: Record<string, string>): Title {
    return {
        id: randomUUID(),
        type: data.media_type === "movie" ? "movie" : "series",
        title: data.title || data.name,
        localizedTitles: translations,
        year:
            data.release_date || data.first_air_date
                ? new Date(data.release_date || data.first_air_date).getFullYear()
                : undefined,
        genres: data.genres?.map((g: any) => mapTMDbGenre(g.id)).filter(Boolean),
        durationMinutes: data.runtime || data.episode_run_time?.[0],
        ratings: { tmdb: data.vote_average },
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : undefined,
        externalIds: { tmdb: String(data.id) },
        public: true,
    };
}

async function fetchTMDbTranslations(id: string, type: "movie" | "tv"): Promise<Record<string, string>> {
    const res = await tmdbClient.get(`/${type}/${id}/translations`);

    const titles: Record<string, string> = {};

    for (const t of res.data.translations) {
        const name = t.data.title || t.data.name;
        if (name) {
            titles[t.iso_639_1] = name;
        }
    }

    return titles;
}

function mapTMDbGenre(id: number): TitleGenre | undefined {
    const map: Record<number, TitleGenre> = {
        12: "adventure",
        14: "fantasy",
        16: "animation",
        18: "drama",
        27: "horror",
        28: "action",
        35: "comedy",
        36: "history",
        53: "thriller",
        80: "crime",
        99: "documentary",
        878: "sci_fi",
        9648: "mystery",
        10402: "musical",
        10749: "romance",
        10751: "family",
    };

    return map[id];
}

export async function searchTMDb(query: string, details: boolean): Promise<Title[]> {
    const res = await tmdbClient.get("/search/multi", { params: { query } });

    const searchResults = res.data.results.filter((r: any) => r.media_type === "movie" || r.media_type === "tv");

    let finalData: Title[] = [];

    if (details) {
        const detailedResults = await Promise.all(
            searchResults.map((r: any) => searchTMDbById(r.id, r.media_type === "movie" ? "movie" : "series"))
        );
        finalData = detailedResults.filter((r) => r != null);
    } else {
        finalData = searchResults.map(mapTMDbToTitle);
    }

    return finalData;
}

export async function searchTMDbById(tmdbId: string, type: TitleType): Promise<Title | null> {
    const endpoint = type === "movie" ? "movie" : "tv";
    const res = await tmdbClient.get(`/${endpoint}/${tmdbId}`);
    const data = res.data;

    if (!data) return null;

    const translations = await fetchTMDbTranslations(tmdbId, endpoint);

    return mapTMDbToTitle(data, translations);
}

// --------------- OMDb ---------------

const omdbClient: AxiosInstance = axios.create({
    baseURL: OMDB_BASE_URL,
    params: { apiKey: OMDB_API_KEY },
});

function mapOMDbToTitle(data: any): Title {
    return {
        id: randomUUID(),
        type: data.Type === "series" ? "series" : "movie",
        title: data.Title,
        year: data.Year ? parseInt(data.Year) : undefined,
        genres: data.Genre ? mapOMDbGenre(data.Genre) : undefined,
        directors: data.Director ? data.Director.split(",").map((s: string) => s.trim()) : undefined,
        actors: data.Actors ? data.Actors.split(",").map((s: string) => s.trim()) : undefined,
        durationMinutes: data.Runtime ? parseInt(data.Runtime) : undefined,
        ratings: data.imdbRating ? { imdb: parseFloat(data.imdbRating) } : undefined,
        poster: data.Poster && data.Poster !== "N/A" ? data.Poster : undefined,
        public: true,
        externalIds: { imdb: data.imdbID },
    };
}

function mapOMDbGenre(genres: string): TitleGenre[] {
    const genreMap: Record<string, TitleGenre> = {
        Action: "action",
        Adventure: "adventure",
        Animation: "animation",
        Comedy: "comedy",
        Crime: "crime",
        Documentary: "documentary",
        Drama: "drama",
        Family: "family",
        Fantasy: "fantasy",
        History: "history",
        Horror: "horror",
        Musical: "musical",
        Mystery: "mystery",
        Romance: "romance",
        "Sci-Fi": "sci_fi",
        Thriller: "thriller",
    };
    return genres
        .split(",")
        .map((g) => g.trim())
        .map((g) => genreMap[g])
        .filter((g): g is TitleGenre => !!g);
}

export async function searchOMDb(query: string): Promise<Title[]> {
    const res = await omdbClient.get("", { params: { t: query } });
    const data = res.data;

    if (data.Response === "False") return [];

    return [mapOMDbToTitle(data)];
}

export async function searchOMDbById(imdbId: string): Promise<Title | null> {
    const res = await omdbClient.get("", { params: { i: imdbId } });
    const data = res.data;

    if (data.Response === "False") return null;

    return mapOMDbToTitle(data);
}

// --------------- ČSFD ---------------

function mapCSFDToTitle(data: any): Title {
    const localizedTitles: Record<string, string> = {};
    for (let t of data.titlesOther ?? []) {
        const lang = mapCSFDLanguage(t.country) || t.country;
        localizedTitles[lang] = t.title;
    }

    return {
        id: randomUUID(),
        title: data.title,
        year: parseInt(data.year),
        type: data.type === "film" ? "movie" : "series",
        genres: data.genres?.map(mapCSFDGenre).filter(Boolean),
        directors: data.creators?.directors?.map((d: any) => d.name),
        actors: data.creators?.actors?.map((a: any) => a.name),
        durationMinutes: data.length,
        ratings: data.rating != null ? { csfd: data.rating / 10 } : undefined,
        poster: data.poster || data.photo,
        localizedTitles: Object.keys(localizedTitles).length > 0 ? localizedTitles : undefined,
        externalIds: { csfd: String(data.id) },
        public: true,
    };
}

function mapCSFDGenre(raw: string): TitleGenre | undefined {
    const map: Record<string, TitleGenre> = {
        Akční: "action",
        Drama: "drama",
        "Sci-Fi": "sci_fi",
        Komedie: "comedy",
        Horor: "horror",
        Romantický: "romance",
        Dobrodružný: "adventure",
        Thriller: "thriller",
        Fantasy: "fantasy",
        Rodinný: "family",
        Historický: "history",
        Krimi: "crime",
        Animovaný: "animation",
        Muzikál: "musical",
        Dokument: "documentary",
        Mysteriózní: "mystery",
    };
    return map[raw];
}

function mapCSFDLanguage(raw: string): string | undefined {
    const map: Record<string, string> = {
        USA: "en",
        "Velká Británie": "en",
        UK: "en",
        Česko: "cs",
        Československo: "cs",
        Slovensko: "sk",
        Francie: "fr",
        Německo: "de",
        Itálie: "it",
        Španělsko: "es",
        Japonsko: "ja",
        "Jižní Korea": "ko",
        Polsko: "pl",
        Maďarsko: "hu",
        Dánsko: "da",
        Švédsko: "sv",
        Norsko: "no",
        Kanada: "en",
        Austrálie: "en",
        "Nový Zéland": "en",
    };
    return map[raw];
}

export async function searchCSFD(query: string, details: boolean): Promise<Title[]> {
    const res = await csfd.search(query);

    const searchResults = [...(res.movies || []), ...(res.tvSeries || [])];

    let finalData: Title[] = [];

    if (details) {
        const detailedResults = await Promise.all(searchResults.map((r) => searchCSFDById(r.id.toString())));
        finalData = detailedResults.filter((r) => r != null);
    } else {
        finalData = searchResults.map(mapCSFDToTitle);
    }

    return finalData;
}

export async function searchCSFDById(csfdId: string): Promise<Title | null> {
    const id = Number(csfdId);
    if (isNaN(id)) return null;

    const data = await csfd.movie(id);
    if (!data) return null;

    return mapCSFDToTitle(data);
}
