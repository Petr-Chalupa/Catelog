import axios, { AxiosInstance } from "axios";
import { Title, TitleGenre, TitleType } from "../title.model";
import { randomUUID } from "node:crypto";

const TMDB_TYPE_MAP: Record<string, TitleType> = {
    movie: "movie",
    tv: "series",
    person: "other",
    collection: "other",
};

const TMDB_GENRE_MAP: Record<number, TitleGenre> = {
    28: "action",
    12: "adventure",
    16: "animation",
    35: "comedy",
    80: "crime",
    99: "documentary",
    18: "drama",
    10751: "family",
    14: "fantasy",
    36: "history",
    27: "horror",
    10402: "musical",
    9648: "mystery",
    10749: "romance",
    878: "sci_fi",
    53: "thriller",
    10752: "war",
};

const tmdbClient: AxiosInstance = axios.create({
    baseURL: process.env.TMDB_BASE_URL,
    params: { api_key: process.env.TMDB_API_KEY },
});

function mapTMDbToTitle(data: any, translations?: Record<string, string>): Title {
    const allTitles = { ...translations };
    const originalTitle = data.original_title || data.original_name;
    const originalLang = data.original_language;
    if (originalTitle && originalLang) allTitles[originalLang] = originalTitle;

    return {
        id: randomUUID(),
        type: TMDB_TYPE_MAP[data.media_type ?? (data.title ? "movie" : "tv")] ?? "other",
        titles: allTitles,
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : undefined,
        year:
            data.release_date || data.first_air_date
                ? new Date(data.release_date || data.first_air_date).getFullYear()
                : undefined,
        genres: data.genre_ids?.map((id: number) => TMDB_GENRE_MAP[id]).filter(Boolean),
        ratings: { tmdb: data.vote_average },
        directors: [],
        actors: [],
        durationMinutes: data.runtime || data.episode_run_time?.[0],
        externalIds: { tmdb: String(data.id) },
        mergeCandidates: [],
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

export async function searchTMDb(query: string, details: boolean): Promise<Title[]> {
    const res = await tmdbClient.get("/search/multi", { params: { query } });

    const searchResults = res.data.results.filter((r: any) => r.media_type === "movie" || r.media_type === "tv");

    let finalData: Title[] = [];

    if (details) {
        const detailedResults = await Promise.all(searchResults.map((r: any) => searchTMDbById(r.id, r.media_type)));
        finalData = detailedResults.filter((r) => r != null);
    } else {
        finalData = searchResults.map(mapTMDbToTitle);
    }

    return finalData;
}

export async function searchTMDbById(tmdbId: string, type: "movie" | "tv"): Promise<Title | null> {
    const res = await tmdbClient.get(`/${type}/${tmdbId}`);
    const data = res.data;

    if (!data) return null;

    const translations = await fetchTMDbTranslations(tmdbId, type);

    return mapTMDbToTitle(data, translations);
}

export function mapTitleTypeToTMDB(type: TitleType): "movie" | "tv" {
    return type === "series" ? "tv" : "movie";
}
