import { sendPushNotification, sendPushNotificationToWatchlistMembers } from "../notifications/notifications.service";
import { getTitleById } from "../title/title.adapter";
import { getUserById } from "../user/user.adapter";
import {
    deleteWatchListItem,
    getValidatedWatchList,
    getWatchListById,
    getWatchListItemById,
    transferWatchlist,
    upsertWatchListItem,
} from "./watchlist.adapter";

export async function addItemToWatchList(listId: string, userId: string, titleId: string) {
    const watchlist = await getValidatedWatchList(listId, userId);
    const newItem = await upsertWatchListItem(listId, { titleId, addedBy: userId });
    const title = await getTitleById(titleId);
    const titleName = title.titles["en"] || Object.values(title.titles)[0];

    sendPushNotificationToWatchlistMembers(listId, userId, {
        msgKey: "notifications.push.watchlist-item-added",
        params: {
            listName: watchlist.name,
            title: titleName,
        },
        url: `/watchlist/${listId}`,
    }).catch((err) => console.error("Notification failed:", err));

    return newItem;
}

export async function removeItemFromWatchList(listId: string, userId: string, itemId: string) {
    await getValidatedWatchList(listId, userId);
    const item = await getWatchListItemById(itemId);
    const title = await getTitleById(item.titleId);
    const watchlist = await getWatchListById(listId);

    const titleName = title.titles["en"] || Object.values(title.titles)[0];

    await deleteWatchListItem(listId, itemId);

    sendPushNotificationToWatchlistMembers(listId, userId, {
        msgKey: "notifications.push.watchlist-item-removed",
        params: {
            listName: watchlist.name,
            title: titleName,
        },
        url: `/watchlist/${listId}`,
    }).catch((err) => console.error("Notification failed:", err));
}

export async function transferWatchListOwnership(listId: string, currentOwnerId: string, newOwnerId: string) {
    await transferWatchlist(listId, currentOwnerId, newOwnerId);

    const watchlist = await getWatchListById(listId);
    const newOwner = await getUserById(newOwnerId);

    sendPushNotification(newOwnerId, {
        msgKey: "notifications.push.watchlist-transferred-new-owner",
        params: {
            listName: watchlist.name,
        },
        url: `/watchlist/${listId}`,
    }).catch((err) => console.error("New owner notification failed:", err));

    sendPushNotificationToWatchlistMembers(listId, currentOwnerId, {
        msgKey: "notifications.push.watchlist-owner-changed",
        params: {
            listName: watchlist.name,
            newOwnerName: newOwner.name ?? newOwner.email,
        },
        url: `/watchlist/${listId}`,
    }).catch((err) => console.error("Members notification failed:", err));
}
