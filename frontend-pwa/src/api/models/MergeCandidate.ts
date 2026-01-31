/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TitleType } from './TitleType';
export type MergeCandidate = {
    /**
     * Required if origin is 'internal'
     */
    internalId?: string;
    /**
     * Required if origin is NOT 'internal'
     */
    externalIds?: Record<string, string>;
    displayData: {
        titles: Record<string, string>;
        year: number;
        type: TitleType;
        poster?: string;
    };
};

