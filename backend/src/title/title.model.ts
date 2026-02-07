export type TitleType = "movie" | "series" | "other";
export type TitleSource = "imdb" | "tmdb" | "csfd";
export type TitleGenre =
    | "action"
    | "adventure"
    | "biography"
    | "comedy"
    | "drama"
    | "fantasy"
    | "fairytale"
    | "horror"
    | "history"
    | "sci_fi"
    | "sport"
    | "romance"
    | "thriller"
    | "animation"
    | "documentary"
    | "crime"
    | "mystery"
    | "family"
    | "musical"
    | "war";

export interface Title {
    id: string;
    type: TitleType;
    titles: Record<string, string>;
    poster?: string;
    year?: number;
    genres: TitleGenre[];
    ratings: Partial<Record<TitleSource, number>>;
    avgRating?: number;
    directors: string[];
    actors: string[];
    durationMinutes?: number;
    externalIds: Partial<Record<TitleSource, string>>;
    mergeCandidates: MergeCandidate[];
    public: boolean;
    updatedAt?: Date;
    createdAt?: Date;
}

export interface MergeCandidate {
    externalIds?: Partial<Record<TitleSource, string>>;
    internalId?: string;
    displayData: {
        titles: Record<string, string>;
        year?: number;
        type?: TitleType;
        poster?: string;
    };
}
