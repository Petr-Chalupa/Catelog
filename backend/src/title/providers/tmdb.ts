import axios, { AxiosInstance } from "axios";
import { Title, TitleGenre, TitleType } from "../title.model";
import { randomUUID } from "node:crypto";

const tmdbClient: AxiosInstance = axios.create({
    baseURL: process.env.TMDB_BASE_URL,
    params: { api_key: process.env.TMDB_API_KEY },
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
