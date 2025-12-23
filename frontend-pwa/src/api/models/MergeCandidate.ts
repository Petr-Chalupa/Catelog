/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MergeCandidate = {
    origin: MergeCandidate.origin;
    internalId?: string;
    externalId?: string;
    displayData: {
        title: string;
        year?: number;
        poster?: string;
    };
};
export namespace MergeCandidate {
    export enum origin {
        INTERNAL = 'internal',
        TMDB = 'tmdb',
        IMDB = 'imdb',
        CSFD = 'csfd',
    }
}

