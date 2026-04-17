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

let _tmdbRequest: any = null;
function getTMDbRequest() {
    if (!_tmdbRequest) {
        _tmdbRequest = $fetch.create({
            baseURL: useRuntimeConfig().TMDB_BASE_URL,
            params: { api_key: useRuntimeConfig().TMDB_API_KEY },
            onResponseError({ response }) {
                if (response.status === 429) {
                    LOG({ level: "WARN", message: "[TMDb] Rate limit hit", context: { status: response.status } });
                } else {
                    LOG({ level: "ERROR", message: "[TMDb] Unknown error", context: { status: response.status } });
                }
            },
        });
    }

    return _tmdbRequest;
}

function mapTMDbToTitle(data: any, translations?: Record<string, string>): TitleCreate {
    const allTitles = { ...translations };
    const originalTitle = data.original_title || data.original_name;
    const originalLang = data.original_language;
    if (originalTitle && originalLang) allTitles[originalLang] = originalTitle;

    return {
        type: TMDB_TYPE_MAP[data.media_type ?? (data.title ? "movie" : "tv")] ?? "other",
        titles: allTitles,
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : undefined,
        year:
            data.release_date || data.first_air_date
                ? new Date(data.release_date || data.first_air_date).getFullYear()
                : undefined,
        genres: data.genre_ids ? data.genre_ids.map((id: number) => TMDB_GENRE_MAP[id]).filter(Boolean) : [],
        ratings: { tmdb: data.vote_average },
        directors: [],
        actors: [],
        durationMinutes: data.runtime || data.episode_run_time?.[0],
        externalIds: { tmdb: String(data.id) },
    };
}

async function fetchTMDbTranslations(id: string, type: "movie" | "tv"): Promise<Record<string, string>> {
    const res = await getTMDbRequest()(`/${type}/${id}/translations`);

    const titles: Record<string, string> = {};

    if (res?.translations) {
        for (const t of res.translations) {
            const name = t.data?.title || t.data?.name;
            if (name) {
                titles[t.iso_639_1] = name;
            }
        }
    }

    return titles;
}

export async function searchTMDb(query: string, details: boolean): Promise<TitleCreate[]> {
    const res = await getTMDbRequest()("/search/multi", { query: { query } });

    const searchResults = res.results?.filter((r: any) => r.media_type === "movie" || r.media_type === "tv");

    if (details) {
        const detailedResults = await Promise.all(
            searchResults.map((r: any) => searchTMDbById(String(r.id), r.media_type)),
        );
        return detailedResults.filter((r): r is TitleCreate => r !== null);
    }

    return searchResults.map((r: any) => mapTMDbToTitle(r));
}

export async function searchTMDbById(tmdbId: string, type: "movie" | "tv"): Promise<TitleCreate | null> {
    const data = await getTMDbRequest()(`/${type}/${tmdbId}`);
    if (!data) return null;

    const translations = await fetchTMDbTranslations(tmdbId, type);

    return mapTMDbToTitle(data, translations);
}

export function mapTitleTypeToTMDB(type: TitleType): "movie" | "tv" {
    return type === "series" ? "tv" : "movie";
}
