export type TitleType = "movie" | "series";
export type TitleSource = "imdb" | "tmdb" | "csfd";
export type TitleGenre =
    | "action"
    | "adventure"
    | "comedy"
    | "drama"
    | "fantasy"
    | "horror"
    | "history"
    | "sci_fi"
    | "romance"
    | "thriller"
    | "animation"
    | "documentary"
    | "crime"
    | "mystery"
    | "family"
    | "musical";

export interface Title {
    id: string;
    type: TitleType;
    title: string;
    localizedTitles?: Record<string, string>;
    poster?: string;
    year?: number;
    genres?: TitleGenre[];
    ratings?: Partial<Record<TitleSource, number>>;
    avgRating?: number;
    directors?: string[];
    actors?: string[];
    durationMinutes?: number;
    externalIds: Partial<Record<TitleSource, string>>;
    mergeCandidates?: string[];
    public: boolean;
    updatedAt?: Date;
    createdAt?: Date;
}

export function computeAvgRating(ratings: Partial<Record<TitleSource, number>> = {}): number {
    const normalizedValues: number[] = Object.values(ratings).filter((r) => !isNaN(r));
    const avg = normalizedValues.reduce((a, b) => a + b, 0) / normalizedValues.length;
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
