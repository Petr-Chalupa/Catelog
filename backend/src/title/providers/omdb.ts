import axios, { AxiosInstance } from "axios";
import { Title, TitleGenre, TitleType } from "../title.model";
import { randomUUID } from "node:crypto";

const OMDB_TYPE_MAP: Record<string, TitleType> = {
    movie: "movie",
    series: "series",
    episode: "other",
    game: "other",
};

const OMDB_GENRE_MAP: Record<string, TitleGenre> = {
    Action: "action",
    Adventure: "adventure",
    Comedy: "comedy",
    Drama: "drama",
    Fantasy: "fantasy",
    Horror: "horror",
    History: "history",
    "Sci-Fi": "sci_fi",
    Romance: "romance",
    Thriller: "thriller",
    Animation: "animation",
    Documentary: "documentary",
    Crime: "crime",
    Mystery: "mystery",
    Family: "family",
    Musical: "musical",
};

const omdbClient: AxiosInstance = axios.create({
    baseURL: process.env.OMDB_BASE_URL,
    params: { apiKey: process.env.OMDB_API_KEY },
});

function mapOMDbToTitle(data: any): Title {
    const genres =
        data.Genre?.split(", ")
            .map((g: string) => OMDB_GENRE_MAP[g])
            .filter(Boolean) ?? [];

    return {
        id: randomUUID(),
        type: OMDB_TYPE_MAP[data.Type] ?? "other",
        title: data.Title,
        localizedTitles: { en: data.Title },
        year: data.Year ? parseInt(data.Year) : undefined,
        genres,
        directors: data.Director ? data.Director.split(",").map((s: string) => s.trim()) : undefined,
        actors: data.Actors ? data.Actors.split(",").map((s: string) => s.trim()) : undefined,
        durationMinutes: data.Runtime ? parseInt(data.Runtime) : undefined,
        ratings: data.imdbRating && data.imdbRating !== "N/A" ? { imdb: parseFloat(data.imdbRating) } : undefined,
        poster: data.Poster && data.Poster !== "N/A" ? data.Poster : undefined,
        public: true,
        externalIds: { imdb: data.imdbID },
    };
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
