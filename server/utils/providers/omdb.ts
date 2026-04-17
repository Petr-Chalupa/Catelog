const OMDB_TYPE_MAP: Record<string, TitleType> = {
    movie: "movie",
    series: "series",
    episode: "other",
    game: "other",
};

const OMDB_GENRE_MAP: Record<string, TitleGenre> = {
    Action: "action",
    Adventure: "adventure",
    Biography: "biography",
    Comedy: "comedy",
    Drama: "drama",
    Fantasy: "fantasy",
    Horror: "horror",
    History: "history",
    "Sci-Fi": "sci_fi",
    Romance: "romance",
    Sport: "sport",
    Thriller: "thriller",
    Animation: "animation",
    Documentary: "documentary",
    Crime: "crime",
    Mystery: "mystery",
    Family: "family",
    Musical: "musical",
    War: "war",
};

let _omdbRequest: any = null;
function getOMDbRequest() {
    if (!_omdbRequest) {
        _omdbRequest = $fetch.create({
            baseURL: useRuntimeConfig().OMDB_BASE_URL,
            params: { apiKey: useRuntimeConfig().OMDB_API_KEY },
            onResponseError({ response }) {
                if (response.status === 429) {
                    LOG({ level: "WARN", message: "[OMDb] Rate limit hit", context: { status: response.status } });
                } else {
                    LOG({ level: "ERROR", message: "[OMDb] Unknown error", context: { status: response.status } });
                }
            },
        });
    }

    return _omdbRequest;
}

function mapOMDbToTitle(data: any): TitleCreate {
    const genres =
        data.Genre?.split(", ")
            .map((g: string) => OMDB_GENRE_MAP[g])
            .filter(Boolean) ?? [];

    return {
        type: OMDB_TYPE_MAP[data.Type] ?? "other",
        titles: { en: data.Title },
        poster: data.Poster && data.Poster !== "N/A" ? data.Poster : undefined,
        year: data.Year ? parseInt(data.Year) : undefined,
        genres,
        ratings: data.imdbRating && data.imdbRating !== "N/A" ? { imdb: parseFloat(data.imdbRating) } : {},
        directors:
            data.Director && data.Director !== "N/A"
                ? data.Director.split(",").map((s: string) => s.trim())
                : undefined,
        actors: data.Actors && data.Actors !== "N/A" ? data.Actors.split(",").map((s: string) => s.trim()) : undefined,
        durationMinutes: data.Runtime ? parseInt(data.Runtime) : undefined,
        externalIds: { imdb: data.imdbID },
    };
}

export async function searchOMDb(query: string): Promise<TitleCreate[]> {
    const data = await getOMDbRequest()("", { query: { t: query } });
    if (data.Response === "False") return [];

    return [mapOMDbToTitle(data)];
}

export async function searchOMDbById(imdbId: string): Promise<TitleCreate | null> {
    const data = await getOMDbRequest()("", { query: { i: imdbId } });
    if (data.Response === "False") return null;

    return mapOMDbToTitle(data);
}
