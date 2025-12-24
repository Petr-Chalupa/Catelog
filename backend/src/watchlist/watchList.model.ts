export type WatchState = "planned" | "started" | "finished";

export interface WatchList {
    id: string;
    name: string;
    ownerId: string;
    sharedWith: string[];
    createdAt: Date;
}

export interface WatchListItem {
    id: string;
    listId: string;
    titleId: string;
    state: WatchState;
    tags?: string[];
    personalRating?: number;
    addedBy: string;
    sortKey: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Invite {
    id: string;
    listId: string;
    inviter: string;
    invitee: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
