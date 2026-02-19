import { sendPushNotification, sendPushNotificationToWatchlistMembers } from "../notifications/notifications.service.js";
import { getUserById } from "../user/user.adapter.js";
import { getWatchListById } from "../watchlist/watchlist.adapter.js";
import { acceptInvite, createInvite } from "./invite.adapter.js";

export async function inviteUserToWatchlist(listId: string, inviterId: string, inviteeId: string) {
    const invite = await createInvite(listId, inviterId, inviteeId);
    const watchlist = await getWatchListById(listId);

    sendPushNotification(inviteeId, {
        msgKey: "notifications.push.invite-received",
        params: {
            listName: watchlist.name,
        },
        url: `/invites`,
    }).catch((err) => console.error("Push failed:", err));

    return invite;
}

export async function processAcceptInvite(token: string, userId: string) {
    const result = await acceptInvite(token, userId);
    const invitee = await getUserById(userId);

    sendPushNotificationToWatchlistMembers(result.id, userId, {
        msgKey: "notifications.push.watchlist-member-joined",
        params: {
            userName: invitee.name ?? invitee.email,
            listName: result.name,
        },
        url: `/watchlist/${result.id}`,
    }).catch((err) => console.error("Member joined notification failed:", err));

    return result;
}
