import webpush from "web-push";
import { deleteUserDevice, getUserById, getUserDevices } from "../user/user.adapter";
import { getWatchListById } from "../watchlist/watchlist.adapter";

export async function sendPushNotification(
    userId: string,
    payload: { msgKey: string; params?: Record<string, string>; url?: string },
) {
    const user = await getUserById(userId);
    if (!user || !user.notificationsEnabled) return;

    webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);

    const devices = await getUserDevices(userId);
    const notifications = devices.map((device) => {
        return webpush
            .sendNotification({ endpoint: device.endpoint, keys: device.keys }, JSON.stringify(payload))
            .catch((err) => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    return deleteUserDevice(userId, device.endpoint);
                }
            });
    });

    await Promise.all(notifications);
}

export async function sendPushNotificationToWatchlistMembers(
    listId: string,
    excludeUserId: string,
    payload: { msgKey: string; params?: Record<string, string>; url?: string },
) {
    const list = await getWatchListById(listId);

    const allMembers = new Set([list.ownerId, ...list.sharedWith]);
    allMembers.delete(excludeUserId);

    const notifications = Array.from(allMembers).map((recipientId) => sendPushNotification(recipientId, payload));
    await Promise.allSettled(notifications);
}
