import webpush from "web-push";
import { getUserBy, getUserDevices } from "./user";
import { getWatchlistById } from "./watchlist";

async function sendPushToDevice(device: UserDeviceDB, payload: PushPayload) {
    try {
        const res = await webpush.sendNotification(
            { endpoint: device.endpoint, keys: device.keys },
            JSON.stringify(payload),
        );
        LOG({ level: "INFO", message: "Push has been sent", context: { user: device.userId, deviceId: device._id } });
        return res.statusCode;
    } catch (err: any) {
        LOG({
            level: "WARN",
            message: "Push was not sent",
            context: { user: device.userId, deviceId: device._id },
            error: err,
        });
        return err.statusCode as number;
    }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
    const user = await getUserBy({ _id: userId });
    if (!user || !user.notificationsEnabled) return;

    const devices = await getUserDevices(userId);
    await Promise.allSettled(
        devices.map(async (device) => {
            const status = await sendPushToDevice(device, payload);
            if (status === 410 || status === 404) await deleteUserDevice(userId, device.endpoint);
        }),
    );
}

export async function sendPushToWatchlistMembers(listId: string, pushSenderId: string, payload: PushPayload) {
    const list = await getWatchlistById(listId);
    if (!list) return;

    const allMemberIds = new Set([list.ownerId, ...list.sharedWith]);
    allMemberIds.delete(pushSenderId);

    await Promise.allSettled(Array.from(allMemberIds).map((recipientId) => sendPushToUser(recipientId, payload)));
}
