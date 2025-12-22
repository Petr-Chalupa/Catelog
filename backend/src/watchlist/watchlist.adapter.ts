import { db } from "../db";
import { deleteUnreferencedTitlePlaceholders } from "../title/title.adapter";
import { WatchList, WatchListItem } from "./watchList.module";

export async function cleanupWatchlistsForUser(userId: string) {
    if (!db) return;

    const watchlistColl = db.collection<WatchList>("watchlists");
    const ownedLists = await watchlistColl.find({ ownerId: userId }).toArray();

    for (const list of ownedLists) {
        if (list.sharedWith && list.sharedWith.length > 0) {
            const [newOwner, ...remaining] = list.sharedWith;
            await watchlistColl.updateOne({ id: list.id }, { $set: { ownerId: newOwner, sharedWith: remaining } });
        } else {
            await deleteWatchlistById(list.id);
        }
    }
}

export async function isWatchlistOwnedBy(listId: string, userId: string): Promise<boolean> {
    if (!db) return false;

    const watchlistColl = db.collection<WatchList>("watchlists");
    const list = await watchlistColl.findOne({ id: listId }, { projection: { ownerId: 1 } });

    return list?.ownerId === userId;
}

export async function deleteWatchlistById(listId: string): Promise<boolean> {
    if (!db) return false;

    const watchlistColl = db.collection<WatchList>("watchlists");
    const itemColl = db.collection<WatchListItem>("watchlist_items");

    await watchlistColl.deleteOne({ id: listId });
    await itemColl.deleteMany({ listId: listId });
    await deleteUnreferencedTitlePlaceholders();

    return true;
}
