import crypto, { randomUUID } from "crypto";
import { Invite } from "./invite.model";
import { WatchList } from "../watchlist/watchList.model";
import { upsertWatchList } from "../watchlist/watchlist.adapter";
import { db } from "../db";
import { User } from "../user/user.model";

export async function getUserInvites(userId: string, type: string): Promise<Invite[]> {
    if (!db) return [];

    const filter = type === "outgoing" ? { inviter: userId } : { invitee: userId };
    const collection = db.collection<Invite>("invites");
    const result = await collection.find(filter).toArray();

    return result;
}

export async function getInviteDetails(inviteId: string): Promise<{ inviterName: string; listName: string } | null> {
    if (!db) return null;

    const collection = db.collection<Invite>("invites");
    const invite = await collection.findOne({ id: inviteId });
    if (!invite) return null;

    const [inviter, watchlist] = await Promise.all([
        db.collection<User>("users").findOne({ id: invite.inviter }),
        db.collection<WatchList>("watchlists").findOne({ id: invite.listId }),
    ]);

    return { inviterName: inviter?.name || "Someone", listName: watchlist?.name || "a watchlist" };
}

export async function createInvite(listId: string, inviterId: string, inviteeId: string): Promise<Invite | null> {
    if (!db) return null;

    const now = new Date();
    const invite: Invite = {
        id: randomUUID(),
        listId,
        inviter: inviterId,
        invitee: inviteeId,
        token: crypto.randomBytes(32).toString(),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: now,
    };

    const collection = db.collection<Invite>("invites");
    await collection.insertOne(invite);

    return invite;
}

export async function acceptInvite(token: string, userId: string): Promise<WatchList | number | null> {
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
