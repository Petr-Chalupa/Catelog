import crypto, { randomUUID } from "crypto";
import { Invite } from "./invite.model.js";
import { WatchList } from "../watchlist/watchList.model.js";
import { getValidatedWatchList, upsertWatchList } from "../watchlist/watchlist.adapter.js";
import { getDB } from "../db.js";
import { User } from "../user/user.model.js";
import { APIError } from "../middleware/error.middleware.js";

export async function getUserInvites(userId: string, type: string): Promise<Invite[]> {
    const db = getDB();
    const filter = type === "outgoing" ? { inviter: userId } : { invitee: userId };
    const result = await db.collection<Invite>("invites").find(filter).toArray();

    return result;
}

export async function getWatchlistInvites(userId: string, listId: string): Promise<Invite[]> {
    const db = getDB();

    await getValidatedWatchList(listId, userId); // Check member
    const result = await db.collection<Invite>("invites").find({ listId }).toArray();

    return result;
}

export async function getInviteByToken(token: string): Promise<Invite> {
    const db = getDB();
    const invite = await db.collection<Invite>("invites").findOne({ token });
    if (!invite) throw new APIError(404, "Invite not found");

    return invite;
}

export async function getInviteDetails(inviteId: string): Promise<{ inviterName: string; inviterEmail: string; inviteeName: string; inviteeEmail: string; listName: string }> {
    const db = getDB();
    const invite = await db.collection<Invite>("invites").findOne({ id: inviteId });
    if (!invite) throw new APIError(404, "Invite details not found");

    const [inviter, invitee, watchlist] = await Promise.all([
        db.collection<User>("users").findOne({ id: invite.inviter }),
        db.collection<User>("users").findOne({ id: invite.invitee }),
        db.collection<WatchList>("watchlists").findOne({ id: invite.listId }),
    ]);

    return {
        inviterName: inviter?.name || "Someone",
        inviterEmail: inviter?.email || "unknown",
        inviteeName: invitee?.name || "Someone",
        inviteeEmail: invitee?.email || "unknown",
        listName: watchlist?.name || "a watchlist",
    };
}

export async function createInvite(listId: string, inviterId: string, inviteeId: string): Promise<Invite> {
    const db = getDB();
    const now = new Date();
    const invite: Invite = {
        id: randomUUID(),
        listId,
        inviter: inviterId,
        invitee: inviteeId,
        token: crypto.randomBytes(32).toString("hex"),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: now,
    };

    await db.collection<Invite>("invites").insertOne(invite);

    return invite;
}

export async function acceptInvite(token: string, userId: string): Promise<WatchList> {
    const db = getDB();
    const inviteColl = db.collection<Invite>("invites");
    const watchlistColl = db.collection<WatchList>("watchlists");

    const invite = await inviteColl.findOne({ token });
    if (!invite) throw new APIError(404, "Invite not found");
    if (invite.expiresAt < new Date()) throw new APIError(400, "This invite is expired");
    if (invite.invitee !== userId) throw new APIError(403, "This invite is not for you");

    const watchlist = await watchlistColl.findOne({ id: invite.listId });
    if (!watchlist) throw new APIError(404, "Related watchlist not found");

    await inviteColl.deleteOne({ token });
    const updatedSharedWith = Array.from(new Set([...watchlist.sharedWith, userId]));

    const result = await upsertWatchList({ id: watchlist.id, sharedWith: updatedSharedWith }, userId);
    if (!result) throw new APIError(500, "Failed to update watchlist members");

    return result;
}

export async function declineInvite(inviteId: string, userId: string): Promise<void> {
    const db = getDB();
    const result = await db.collection<Invite>("invites").deleteOne({ id: inviteId, invitee: userId });
    if (result.deletedCount === 0) throw new APIError(404, "Invite not found or already processed");
}
