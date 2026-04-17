import { getDB } from "./db";
import crypto from "crypto";
import { sendPushToUser, sendPushToWatchlistMembers } from "./notif";
import { getWatchlistDetails, hasUserWatchlistAccess } from "./watchlist";
import { getUserDetails } from "./user";

export async function getInviteById(_id: string): Promise<InviteDB | null> {
    const db = getDB();
    return await db.collection<InviteDB>("invites").findOne({ _id: _id });
}

export async function getUserInvites(userId: string, type: "outgoing" | "incoming"): Promise<InviteDB[]> {
    const db = getDB();
    const filter = type === "outgoing" ? { inviterId: userId } : { inviteeId: userId };
    return await db.collection<InviteDB>("invites").find(filter).toArray();
}

export async function getWatchlistInvites(userId: string, listId: string): Promise<InviteDB[]> {
    const db = getDB();
    await hasUserWatchlistAccess(listId, userId);
    return await db.collection<InviteDB>("invites").find({ listId }).toArray();
}

export async function getInviteDetails(inviteId: string): Promise<InvitePublic> {
    const invite = await getInviteById(inviteId);
    if (!invite) throw createError({ statusCode: 404, statusMessage: "Invite not found" });

    const [inviter, invitee, list] = await Promise.all([
        getUserDetails(invite.inviterId, true) as Promise<UserPublicMinimal>,
        getUserDetails(invite.inviteeId, true) as Promise<UserPublicMinimal>,
        getWatchlistDetails(invite.listId, invite.inviterId),
    ]);

    const { _id, createdAt, expiresAt } = invite;
    return { _id, createdAt, expiresAt, list, inviter, invitee };
}

export async function createInvite(data: InviteCreate): Promise<InviteDB> {
    if (data.inviterId === data.inviteeId) {
        throw createError({ statusCode: 400, statusMessage: "You cannot invite yourself" });
    }

    const db = getDB();
    const now = new Date();
    const list = await hasUserWatchlistAccess(data.listId, data.inviterId);

    const newInvite: InviteDB = {
        _id: crypto.randomUUID(),
        listId: data.listId,
        inviterId: data.inviterId,
        inviteeId: data.inviteeId,
        token: crypto.randomBytes(32).toString("hex"),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: now,
    };

    const result = await db.collection<InviteDB>("invites").insertOne(newInvite);

    if (!result.acknowledged) throw createError({ statusCode: 500, statusMessage: "Invite could not be created" });

    sendPushToUser(data.inviteeId, {
        title: "New invitation",
        body: `You have been invited to ${list.name} list!`,
        url: `/watchlists/${data.listId}`,
    });

    return newInvite;
}

export async function acceptInvite(token: string, userId: string): Promise<WatchlistDB> {
    const db = getDB();

    const invite = await db.collection<InviteDB>("invites").findOne({ token });
    if (!invite) throw createError({ statusCode: 404, statusMessage: "Invite not found" });

    if (invite.expiresAt < new Date()) {
        await db.collection("invites").deleteOne({ token });
        throw createError({ statusCode: 400, statusMessage: "Invite has expired" });
    }
    if (invite.inviteeId !== userId) {
        throw createError({ statusCode: 403, statusMessage: "This invite was not intended for you" });
    }

    const updatedList = await db.collection<WatchlistDB>("watchlists").findOneAndUpdate(
        { _id: invite.listId },
        {
            $addToSet: { sharedWith: userId },
            $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" },
    );

    if (!updatedList) throw createError({ statusCode: 404, statusMessage: "Target watchlist not found" });

    await db.collection("invites").deleteOne({ token });

    sendPushToWatchlistMembers(invite.listId, userId, {
        title: "New member",
        body: `Someone joined the ${updatedList.name} list!`,
        url: `/watchlists/${invite.listId}`,
    });

    return updatedList;
}

export async function declineInvite(inviteId: string, userId: string) {
    const db = getDB();

    const result = await db.collection<InviteDB>("invites").deleteOne({ _id: inviteId, inviteeId: userId });

    if (result.deletedCount !== 1) {
        throw createError({ statusCode: 404, statusMessage: "Invite not found or already deleted" });
    }
}
