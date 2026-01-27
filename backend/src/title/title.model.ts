export type TitleType = "movie" | "series" | "other";
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
    mergeCandidates?: MergeCandidate[];
    public: boolean;
    updatedAt?: Date;
    createdAt?: Date;
}

export interface MergeCandidate {
    origin: TitleSource | "internal";
    externalId?: string;
    internalId?: string;
    displayData: {
        title: string;
        year?: number;
        poster?: string;
    };
}
