import { randomUUID } from "node:crypto";
import { db } from "../db";
import { deleteUnreferencedTitlePlaceholders } from "../title/title.adapter";
import { Invite, WatchList, WatchListItem } from "./watchList.module";
import { APIError } from "../middleware/error.middleware";

export async function getWatchListById(listId: string): Promise<WatchList | null> {
    if (!db) return null;

    const collection = db.collection<WatchList>("watchlists");
    const result = await collection.findOne({ id: listId });

    return result;
}

export async function getUserWatchLists(userId: string): Promise<WatchList[]> {
    if (!db) return [];

    const collection = db.collection<WatchList>("watchlists");
    const lists = await collection.find({ $or: [{ ownerId: userId }, { sharedWith: userId }] }).toArray();

    return lists;
}

export async function upsertWatchList(watchlist: Partial<WatchList>, ownerId: string): Promise<WatchList | null> {
    if (!db) return null;

    const collection = db.collection<WatchList>("watchlists");

    const filter = watchlist.id ? { id: watchlist.id } : { name: watchlist.name, ownerId };
    const update = {
        $set: {
            ...watchlist,
            updatedAt: new Date(),
        },
        $setOnInsert: {
            id: watchlist.id || randomUUID(),
            ownerId,
            createdAt: new Date(),
        },
    };
    const options = { upsert: true, returnDocument: "after" as const };
    const result = await collection.findOneAndUpdate(filter, update, options);

    return result;
}

export async function cleanupWatchListsForUser(userId: string) {
    if (!db) return;

    const collection = db.collection<WatchList>("watchlists");
    const ownedLists = await collection.find({ ownerId: userId }).toArray();

    for (const list of ownedLists) {
        if (list.sharedWith && list.sharedWith.length > 0) {
            const [newOwner, ...remaining] = list.sharedWith;
            await collection.updateOne({ id: list.id }, { $set: { ownerId: newOwner, sharedWith: remaining } });
        } else {
            await deleteWatchListById(list.id);
        }
    }
}

export async function isWatchListOwnedBy(listId: string, userId: string, ownerOnly: boolean): Promise<boolean> {
    if (!db) return false;

    const collection = db.collection<WatchList>("watchlists");
    const list = await collection.findOne({ id: listId }, { projection: { ownerId: 1, sharedWith: 1 } });

    const isOwner = list?.ownerId === userId;
    const isCollaborator = list?.sharedWith?.includes(userId) ?? false;

    return ownerOnly ? isOwner : isOwner || isCollaborator;
}

export async function deleteWatchListById(listId: string): Promise<boolean> {
    if (!db) return false;

    const watchlistColl = db.collection<WatchList>("watchlists");
    const itemColl = db.collection<WatchListItem>("watchlist_items");

    await watchlistColl.deleteOne({ id: listId });
    await itemColl.deleteMany({ listId: listId });
    await deleteUnreferencedTitlePlaceholders();

    return true;
}

export async function getWatchListItems(listId: string): Promise<WatchListItem[]> {
    if (!db) return [];

    const collection = db.collection<WatchListItem>("watchlist_items");
    const items = await collection.find({ listId }).toArray();

    return items;
}

export async function upsertWatchListItem(
    listId: string,
    item: Partial<WatchListItem>,
    addedBy: string
): Promise<WatchListItem | null> {
    if (!db) return null;

    const collection = db.collection<WatchListItem>("watchlist_items");

    const filter = item.id ? { id: item.id } : { listId, titleId: item.titleId };
    const update = {
        $set: {
            ...item,
            updatedAt: new Date(),
            addedBy,
        },
        $setOnInsert: {
            id: item.id || randomUUID(),
            listId,
            createdAt: new Date(),
            state: item.state || "planned",
        },
    };
    const options = { upsert: true, returnDocument: "after" as const };
    const result = await collection.findOneAndUpdate(filter, update, options);

    return result;
}

export async function deleteWatchListItem(listId: string, itemId: string): Promise<boolean> {
    if (!db) return false;

    const collection = db.collection<WatchListItem>("watchlist_items");
    const result = await collection.deleteOne({ id: itemId, listId });

    return result.deletedCount === 1;
}

export async function createWatchListInvite(
    listId: string,
    inviterId: string,
    inviteeId: string
): Promise<Invite | null> {
    if (!db) return null;

    const now = new Date();
    const invite: Invite = {
        id: randomUUID(),
        listId,
        inviter: inviterId,
        invitee: inviteeId,
        token: randomUUID(),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: now,
    };

    const collection = db.collection<Invite>("invites");
    await collection.insertOne(invite);

    return invite;
}

export async function acceptWatchListInvite(token: string, userId: string): Promise<WatchList | number | null> {
    if (!db) return null;

    const inviteColl = db.collection<Invite>("invites");
    const watchlistColl = db.collection<WatchList>("watchlists");

    const invite = await inviteColl.findOne({ token });
    if (!invite) return 404;
    if (invite.expiresAt < new Date()) return 400;
    if (invite.invitee !== userId) return 403;

    await inviteColl.deleteOne({ token });

    const watchlist = await watchlistColl.findOne({ id: invite.listId });
    if (!watchlist) return 404;

    const updatedSharedWith = Array.from(new Set([...watchlist.sharedWith, userId]));
    const result = await upsertWatchList({ id: watchlist.id, sharedWith: updatedSharedWith }, userId);

    return result;
}
