/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WatchListItem = {
    id: string;
    listId: string;
    titleId: string;
    state: WatchListItem.state;
    tags?: Array<string>;
    personalRating?: number;
    addedBy: string;
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

