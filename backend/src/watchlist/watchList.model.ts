import { TitleGenre } from "../title/title.model.js";

export type WatchState = "planned" | "started" | "finished";

export interface WatchList {
    id: string;
    name: string;
    ownerId: string;
    sharedWith: string[];
    sortKey: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WatchListItem {
    id: string;
    listId: string;
    titleId: string;
    state: WatchState;
    addedGenres?: TitleGenre[];
    excludedGenres?: TitleGenre[];
    personalRating?: number;
    addedBy: string;
    sortKey: string;
    createdAt: Date;
    updatedAt: Date;
}
