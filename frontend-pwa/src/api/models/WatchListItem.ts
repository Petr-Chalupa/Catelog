/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TitleGenre } from './TitleGenre';
export type WatchListItem = {
    id: string;
    listId: string;
    titleId: string;
    state: WatchListItem.state;
    addedGenres?: Array<TitleGenre>;
    excludedGenres?: Array<TitleGenre>;
    personalRating?: number;
    addedBy: string;
    sortKey?: string;
    createdAt: string;
    updatedAt?: string;
};
export namespace WatchListItem {
    export enum state {
        PLANNED = 'planned',
        STARTED = 'started',
        FINISHED = 'finished',
    }
}

