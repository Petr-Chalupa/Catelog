/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MergeCandidate } from './MergeCandidate';
import type { TitleGenre } from './TitleGenre';
import type { TitleType } from './TitleType';
export type Title = {
    id: string;
    type: TitleType;
    titles: Record<string, string>;
    poster?: string;
    year?: number;
    genres?: Array<TitleGenre>;
    ratings?: Record<string, number>;
    avgRating?: number;
    directors?: Array<string>;
    actors?: Array<string>;
    durationMinutes?: number;
    externalIds: Record<string, string>;
    mergeCandidates?: Array<MergeCandidate>;
    public: boolean;
    createdAt?: string;
    updatedAt?: string;
};

