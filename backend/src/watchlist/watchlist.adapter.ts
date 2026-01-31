import { randomUUID } from "node:crypto";
import { getDB } from "../db";
import { deleteUnreferencedTitlePlaceholders } from "../title/title.adapter";
import { WatchList, WatchListItem } from "./watchList.model";
import { APIError } from "../middleware/error.middleware";

export async function getWatchListById(listId: string): Promise<WatchList> {
    const db = getDB();
    const result = await db.collection<WatchList>("watchlists").findOne({ id: listId });
    if (!result) throw new APIError(404, "Watchlist not found");

    return result;
}

export async function getUserWatchLists(userId: string): Promise<WatchList[]> {
    const db = getDB();
    const result = await db
        .collection<WatchList>("watchlists")
        .find({ $or: [{ ownerId: userId }, { sharedWith: userId }] })
        .toArray();

    return result;
}

export async function getValidatedWatchList(listId: string, userId: string, requireOwner = false): Promise<WatchList> {
    const list = await getWatchListById(listId);

    const isOwner = list.ownerId === userId;
    const isShared = list.sharedWith.includes(userId);
    if (requireOwner && !isOwner) throw new APIError(403, "Only the owner can perform this action");
    if (!isOwner && !isShared) throw new APIError(403, "You do not have access to this watchlist");

    return list;
}

export async function upsertWatchList(watchlist: Partial<WatchList>, ownerId: string): Promise<WatchList> {
    const db = getDB();
    const collection = db.collection<WatchList>("watchlists");

    const filter = watchlist.id ? { id: watchlist.id } : { name: watchlist.name, ownerId };
    const update = {
        $set: {
            name: watchlist.name,
            sharedWith: watchlist.sharedWith || [],
            sortKey: watchlist.sortKey,
            updatedAt: new Date(),
        },
        $setOnInsert: {
            id: watchlist.id ?? randomUUID(),
            ownerId,
            createdAt: new Date(),
        },
    };
    const options = { upsert: true, returnDocument: "after" as const };

    const result = await collection.findOneAndUpdate(filter, update, options);
    if (!result) throw new APIError(500, "Failed to upsert watchlist");

    return result;
}

export async function cleanupWatchListsForUser(userId: string): Promise<void> {
    const db = getDB();

    await db.collection<WatchList>("watchlists").updateMany({ sharedWith: userId }, { $pull: { sharedWith: userId } });
    const ownedLists = await db.collection<WatchList>("watchlists").find({ ownerId: userId }).toArray();
    for (const list of ownedLists) {
        await deleteWatchListById(list.id);
    }
}

export async function deleteWatchListById(listId: string): Promise<void> {
    const db = getDB();

    const resultItems = await db.collection<WatchListItem>("watchlist_items").deleteMany({ listId });
    const resultList = await db.collection<WatchList>("watchlists").deleteOne({ id: listId });
    if (resultList.deletedCount === 0) throw new APIError(404, "Watchlist not found");

    await deleteUnreferencedTitlePlaceholders();
}

export async function transferWatchlist(listId: string, ownerId: string, newOwnerId: string): Promise<void> {
    const db = getDB();

    if (ownerId === newOwnerId) throw new APIError(400, "New owner must be different from current owner");

    const watchlist = await db.collection<WatchList>("watchlists").findOne({ id: listId });
    if (!watchlist) throw new APIError(404, "Watchlist not found");
    if (watchlist.ownerId !== ownerId) throw new APIError(403, "Only the owner can transfer this watchlist");

    const isMember = watchlist.sharedWith?.some((member) => member === newOwnerId);
    if (!isMember) throw new APIError(400, "New owner must be a member of the watchlist");

    await db.collection<WatchList>("watchlists").updateOne(
        { id: listId },
        {
            $set: { ownerId: newOwnerId },
            $pull: { sharedWith: newOwnerId },
        },
    );
}

export async function getWatchListItems(listId: string): Promise<WatchListItem[]> {
    const db = getDB();
    const result = await db.collection<WatchListItem>("watchlist_items").find({ listId }).toArray();

    return result;
}

export async function getWatchListItemById(itemId: string): Promise<WatchListItem> {
    const db = getDB();
    const item = await db.collection<WatchListItem>("watchlist_items").findOne({ id: itemId });
    if (!item) throw new APIError(404, "Watchlist item not found");

    return item;
}

export async function upsertWatchListItem(listId: string, item: Partial<WatchListItem>): Promise<WatchListItem> {
    const db = getDB();
    const collection = db.collection<WatchListItem>("watchlist_items");

    const filter = item.id ? { id: item.id } : { listId, titleId: item.titleId };
    const update = {
        $set: {
            titleId: item.titleId,
            state: item.state || "planned",
            addedGenres: item.addedGenres,
            excludedGenres: item.excludedGenres,
            personalRating: item.personalRating || 0,
            sortKey: item.sortKey,
            updatedAt: new Date(),
        },
        $setOnInsert: {
            id: item.id || randomUUID(),
            listId,
            addedBy: item.addedBy,
            createdAt: new Date(),
        },
    };
    const options = { upsert: true, returnDocument: "after" as const };

    const result = await collection.findOneAndUpdate(filter, update, options);
    if (!result) throw new APIError(500, "Failed to upsert watchlist item");

    return result;
}

export async function deleteWatchListItem(listId: string, itemId: string): Promise<void> {
    const db = getDB();
    const result = await db.collection<WatchListItem>("watchlist_items").deleteOne({ id: itemId, listId });
    if (result.deletedCount === 0) throw new APIError(404, "Item not found in this watchlist");
}
