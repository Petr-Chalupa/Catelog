export interface WatchList {
    id: string;
    name: string;
    ownerId: string;
    sharedWith: string[];
    order?: number;
    createdAt: Date;
}
