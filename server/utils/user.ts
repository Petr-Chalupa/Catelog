import { getDB } from "./db";
import { cleanupWatchListsForUser } from "./watchlist";
import { Filter } from "mongodb";

export async function getUserBy(query: UserQuery): Promise<UserDB | null> {
    const db = getDB();
    const filter: Filter<UserDB> = {};

    if (query.email) filter.email = query.email;
    if (query.name) filter.name = query.name;
    if (query._id) filter._id = query._id;

    if (Object.keys(filter).length === 0) return null;
    return await db.collection<UserDB>("users").findOne(filter);
}

export async function getUserDetails(userId: string, minimal: boolean): Promise<UserPublic | UserPublicMinimal> {
    const user = await getUserBy({ _id: userId });
    if (!user) throw createError({ statusCode: 404, statusMessage: "User not found" });

    if (minimal) {
        const { _id, name, image } = user;
        return { _id, name, image };
    } else {
        const { _id, email, notificationsEnabled, createdAt, name, image } = user;
        return { _id, email, notificationsEnabled, createdAt, name, image };
    }
}

export async function updateUser(userId: string, data: UserUpdate): Promise<UserDB> {
    const db = getDB();

    const result = await db
        .collection<UserDB>("users")
        .findOneAndUpdate({ _id: userId }, { $set: { ...data, updatedAt: new Date() } }, { returnDocument: "after" });

    if (!result) throw createError({ statusCode: 404, statusMessage: "User not found" });
    return result;
}

export async function deleteUser(userId: string) {
    const db = getDB();

    await cleanupWatchListsForUser(userId);
    await db.collection<UserDeviceDB>("user_devices").deleteMany({ userId });
    await db.collection<InviteDB>("invites").deleteMany({ $or: [{ inviterId: userId }, { inviteeId: userId }] });
    const result = await db.collection<UserDB>("users").deleteOne({ _id: userId });

    if (result.deletedCount !== 1) {
        throw createError({ statusCode: 404, statusMessage: "User not found or already deleted" });
    }
}

export async function getUserDeviceById(_id: string): Promise<UserDeviceDB | null> {
    const db = getDB();
    return await db.collection<UserDeviceDB>("user_devices").findOne({ _id });
}

export async function getUserDevices(userId: string): Promise<UserDeviceDB[]> {
    const db = getDB();

    const devices = await db
        .collection<UserDeviceDB>("user_devices")
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

    return devices;
}

export async function getUserDeviceDetails(deviceId: string): Promise<UserDevicePublic> {
    const device = await getUserDeviceById(deviceId);
    if (!device) throw createError({ statusCode: 404, statusMessage: "Device not found" });

    const { _id, userId, deviceName, createdAt } = device;
    return { _id, userId, deviceName, createdAt };
}

export async function createUserDevice(data: UserDeviceCreate): Promise<UserDeviceDB> {
    const db = getDB();

    const device: UserDeviceDB = {
        _id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await db.collection<UserDeviceDB>("user_devices").insertOne(device);

    if (!result.acknowledged) throw createError({ statusCode: 500, statusMessage: "Device could not be created" });
    return device;
}

export async function updateUserDevice(
    userId: string,
    deviceEndpoint: string,
    data: UserDeviceUpdate,
): Promise<UserDeviceDB> {
    const db = getDB();

    const result = await db
        .collection<UserDeviceDB>("user_devices")
        .findOneAndUpdate(
            { endpoint: deviceEndpoint, userId },
            { $set: { ...data, updatedAt: new Date() } },
            { returnDocument: "after" },
        );

    if (!result) throw createError({ statusCode: 404, statusMessage: "Device not found" });
    return result;
}

export async function deleteUserDevice(userId: string, deviceEndpoint: string): Promise<void> {
    const db = getDB();

    const result = await db.collection<UserDeviceDB>("user_devices").deleteOne({ endpoint: deviceEndpoint, userId });

    if (result.deletedCount !== 1) {
        throw createError({ statusCode: 404, statusMessage: "Device not found or already deleted" });
    }
}
