export type WatchState = "planned" | "started" | "finished";

export interface WatchListItem {
    id: string;
    listId: string;
    titleId: string;
    state: WatchState;
    tags?: string[];
    personalRating?: number;
    order?: number;
    addedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
