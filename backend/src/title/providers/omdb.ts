import axios, { AxiosInstance } from "axios";
import { Title, TitleGenre } from "../title.model";
import { randomUUID } from "node:crypto";

const OMDB_BASE_URL = process.env.OMDB_BASE_URL;
const OMDB_API_KEY = process.env.OMDB_API_KEY;
if (!OMDB_BASE_URL || !OMDB_API_KEY) throw new Error("OMDB env variable(s) not set");

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
