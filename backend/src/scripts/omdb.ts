import axios, { AxiosInstance } from "axios";
import type { Title, TitleGenre } from "../models/Title";

const OMDB_BASE_URL = process.env.OMDB_BASE_URL;
const OMDB_API_KEY = process.env.OMDB_API_KEY;
if (!OMDB_BASE_URL || !OMDB_API_KEY) throw new Error("OMDB env variable(s) not set");

const client: AxiosInstance = axios.create({
    baseURL: OMDB_BASE_URL,
    params: { api_key: OMDB_API_KEY },
});

function mapToTitle(data: any): Title {
    return {
        id: "",
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

export function mapOMDbGenre(genres: string): TitleGenre[] {
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

export async function searchOMDb(title: string, year?: number): Promise<Title | null> {
    const res = await client.get("", { params: { t: title, y: year } });
    const data = res.data;

    if (data.Response === "False") return null;

    return mapToTitle(data);
}

export async function searchOMDbById(imdbId: string): Promise<Title | null> {
    const res = await client.get("", { params: { i: imdbId } });
    const data = res.data;

    if (data.Response === "False") return null;

    return mapToTitle(data);
}
