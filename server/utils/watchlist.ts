import { getDB } from "./db";
import { sendPushToUser, sendPushToWatchlistMembers } from "./notif";
import { UpdateFilter } from "mongodb";
import { deleteUnreferencedTitlePlaceholders, getTitleDetails } from "./title";
import { getUserDetails } from "./user";

export async function getWatchlistById(_id: string): Promise<WatchlistDB | null> {
    const db = getDB();
    return await db.collection<WatchlistDB>("watchlists").findOne({ _id });
}

export async function getUserWatchlists(userId: string): Promise<WatchlistDB[]> {
    const db = getDB();
    return await db
        .collection<WatchlistDB>("watchlists")
        .find({ $or: [{ ownerId: userId }, { sharedWith: { $in: [userId] } }] })
        .toArray();
}

export async function getWatchlistDetails(listId: string, userId: string): Promise<WatchlistPublic> {
    const list = await hasUserWatchlistAccess(listId, userId);
    const owner = (await getUserDetails(list.ownerId, true)) as UserPublicMinimal;
    const sharedWithDetails = await Promise.all(
        list.sharedWith.map((id) => getUserDetails(id, true) as Promise<UserPublicMinimal>),
    );

    const { _id, name, createdAt, sortKey } = list;
    return { _id, name, createdAt, sortKey, owner, sharedWith: sharedWithDetails };
}

export async function hasUserWatchlistAccess(listId: string, userId: string, requireOwner = false) {
    const list = await getWatchlistById(listId);
    if (!list) throw createError({ statusCode: 404, statusMessage: "Watchlist not found" });

    const isOwner = list.ownerId === userId;
    const isShared = list.sharedWith.includes(userId);

    if (requireOwner && !isOwner) {
        throw createError({ statusCode: 403, statusMessage: "Only the owner can perform this action" });
    }

    if (!isOwner && !isShared) {
        throw createError({ statusCode: 403, statusMessage: "You do not have access to this watchlist" });
    }

    return list; // May be discarded if only checking access
}

export async function createWatchList(data: WatchlistCreate): Promise<WatchlistDB> {
    const db = getDB();

    const newList: WatchlistDB = {
        _id: crypto.randomUUID(),
        ...data,
        sharedWith: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await db.collection<WatchlistDB>("watchlists").insertOne(newList);

    if (!result.acknowledged) throw createError({ statusCode: 500, statusMessage: "Watchlist could not be created" });
    return newList;
}

export async function updateWatchlist(userId: string, listId: string, data: WatchlistUpdate): Promise<WatchlistDB> {
    const db = getDB();

    const isTransfer = data.ownerId !== undefined && data.ownerId !== userId; // Only owner can transfer
    await hasUserWatchlistAccess(listId, userId, isTransfer);

    const update: UpdateFilter<WatchlistDB> = { $set: { ...data, updatedAt: new Date() } };
    if (isTransfer) {
        update.$pull = { sharedWith: data.ownerId };
        update.$push = { sharedWith: userId };
    }

    const result = await db
        .collection<WatchlistDB>("watchlists")
        .findOneAndUpdate({ _id: listId }, update, { returnDocument: "after" });

    if (!result) throw createError({ statusCode: 404, statusMessage: "Watchlist not found" });

    if (isTransfer) {
        sendPushToUser(data.ownerId!, {
            title: "List transfered",
            body: `You are the new owner of ${result.name} list!`,
            url: `/watchlists/${listId}`,
        });
    } else {
        sendPushToWatchlistMembers(listId, userId, {
            title: "New owner",
            body: `List ${result.name} has a new owner!`,
            url: `/watchlists/${listId}`,
        });
    }

    return result;
}

export async function deleteWatchlist(userId: string, listId: string) {
    const db = getDB();

    const list = await hasUserWatchlistAccess(listId, userId, true); // Only owner can delete

    await db.collection<WatchlistItemDB>("watchlist_items").deleteMany({ listId });
    const result = await db.collection<WatchlistDB>("watchlists").deleteOne({ _id: listId });

    if (result.deletedCount !== 1) {
        throw createError({ statusCode: 404, statusMessage: "Watchlist not found or already deleted" });
    }

    sendPushToWatchlistMembers(listId, userId, {
        title: "List deleted",
        body: `List ${list.name} was deleted!`,
    });

    await deleteUnreferencedTitlePlaceholders();
}

export async function cleanupWatchListsForUser(userId: string) {
    const db = getDB();

    await db
        .collection<WatchlistDB>("watchlists")
        .updateMany({ sharedWith: userId }, { $pull: { sharedWith: userId } });

    const ownedLists = await db.collection<WatchlistDB>("watchlists").find({ ownerId: userId }).toArray();
    for (const list of ownedLists) {
        await deleteWatchlist(userId, list._id);
    }
}

export async function getWatchlistItems(userId: string, listId: string): Promise<WatchlistItemDB[]> {
    const db = getDB();
    await hasUserWatchlistAccess(listId, userId);
    return await db.collection<WatchlistItemDB>("watchlist_items").find({ listId }).toArray();
}

export async function getWatchlistItemById(_id: string): Promise<WatchlistItemDB | null> {
    const db = getDB();
    return await db.collection<WatchlistItemDB>("watchlist_items").findOne({ _id });
}

export async function getWatchlistItemDetails(itemId: string): Promise<WatchlistItemPublic> {
    const item = await getWatchlistItemById(itemId);
    if (!item) throw createError({ statusCode: 404, statusMessage: "Watchlist item not found" });

    const [title, addedBy] = await Promise.all([
        getTitleDetails(item.titleId),
        getUserDetails(item.addedById, true) as Promise<UserPublicMinimal>,
    ]);

    const { _id, sortKey, createdAt, state, listId, addedGenres, excludedGenres, personalRating } = item;
    return { _id, sortKey, createdAt, state, listId, addedGenres, excludedGenres, personalRating, title, addedBy };
}

export async function createWatchlistItem(userId: string, data: WatchlistItemCreate): Promise<WatchlistItemDB> {
    const db = getDB();

    const listId = data.listId;
    const list = await hasUserWatchlistAccess(listId, userId);

    const newItem: WatchlistItemDB = {
        _id: crypto.randomUUID(),
        ...data,
        state: "planned",
        addedGenres: [],
        excludedGenres: [],
        personalRating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await db.collection<WatchlistItemDB>("watchlist_items").insertOne(newItem);

    if (!result.acknowledged) {
        throw createError({ statusCode: 500, statusMessage: "Watchlist item could not be created" });
    }

    sendPushToWatchlistMembers(listId, userId, {
        title: "New item",
        body: `List ${list.name} has a new item!`,
        url: `/watchlists/${listId}/items/${newItem._id}`,
    });

    return newItem;
}

export async function updateWatchlistItem(
    userId: string,
    listId: string,
    itemId: string,
    data: WatchlistItemUpdate,
): Promise<WatchlistItemDB> {
    const db = getDB();

    const list = await hasUserWatchlistAccess(listId, userId);

    const result = await db
        .collection<WatchlistItemDB>("watchlist_items")
        .findOneAndUpdate(
            { _id: itemId, listId },
            { $set: { ...data, updatedAt: new Date() } },
            { returnDocument: "after" },
        );

    if (!result) throw createError({ statusCode: 404, statusMessage: "Item not found" });

    sendPushToWatchlistMembers(listId, userId, {
        title: "Item updated",
        body: `Item in list ${list.name} was updated!`,
        url: `/watchlists/${listId}/items/${itemId}`,
    });

    return result;
}

export async function deleteWatchlistItem(userId: string, listId: string, itemId: string) {
    const db = getDB();

    const list = await hasUserWatchlistAccess(listId, userId);

    const result = await db.collection<WatchlistItemDB>("watchlist_items").deleteOne({ _id: itemId, listId });

    if (result.deletedCount !== 1) {
        throw createError({ statusCode: 404, statusMessage: "Item not found or already deleted" });
    }
    sendPushToWatchlistMembers(listId, userId, {
        title: "Item deleted",
        body: `Item in list ${list.name} was deleted!`,
        url: `/watchlists/${listId}`,
    });

    await deleteUnreferencedTitlePlaceholders();
}
