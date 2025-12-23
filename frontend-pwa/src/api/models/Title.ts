/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MergeCandidate } from './MergeCandidate';
export type Title = {
    id: string;
    type: Title.type;
    title: string;
    localizedTitles?: Record<string, string>;
    poster?: string;
    year?: number;
    genres?: Array<'action' | 'adventure' | 'comedy' | 'drama' | 'fantasy' | 'horror' | 'history' | 'sci_fi' | 'romance' | 'thriller' | 'animation' | 'documentary' | 'crime' | 'mystery' | 'family' | 'musical'>;
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
export namespace Title {
    export enum type {
        MOVIE = 'movie',
        SERIES = 'series',
    }
}

