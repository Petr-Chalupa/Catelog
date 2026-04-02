import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { User, UserDevice } from "./user.model.js";
import { getDB } from "../db.js";
import { cleanupWatchListsForUser } from "../watchlist/watchlist.adapter.js";
import { APIError } from "../middleware/error.middleware.js";

export async function getUserById(userId: string): Promise<User> {
    const db = getDB();
    const user = await db.collection<User>("users").findOne({ id: userId });
    if (!user) throw new APIError(404, "User not found");

    return user;
}

/**
 * Mutation of getUserById for searching via internal _id
 * Used for fetching complete user data from session
 */
export async function getUserBy_Id(user_Id: string): Promise<User> {
    const db = getDB();
    const user = await db.collection<User & { _id: ObjectId }>("users").findOne({ _id: new ObjectId(user_Id) });
    if (!user) throw new APIError(404, "User not found");

    return user;
}

export async function getUserByEmail(userEmail: string): Promise<User> {
    const db = getDB();
    const user = await db.collection<User>("users").findOne({ email: userEmail });
    if (!user) throw new APIError(404, "User not found");

    return user;
}

export async function upsertUser(user: Partial<User>): Promise<User> {
    const db = getDB();
    const collection = db.collection<User>("users");

    const filter = user.id ? { id: user.id } : { email: user.email };
    const update = {
        $set: {
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified ?? false,
            image: user.image ?? "",
            notificationsEnabled: user.notificationsEnabled ?? false,
            updatedAt: new Date(),
        },
        $setOnInsert: {
            id: user.id ?? randomUUID(),
            createdAt: new Date(),
        },
    };
    const options = { upsert: true, returnDocument: "after" as const };

    const result = await collection.findOneAndUpdate(filter, update, options);
    if (!result) throw new APIError(500, "Failed to upsert user");

    return result;
}

export async function deleteUser(userId: string): Promise<void> {
    const db = getDB();

    await cleanupWatchListsForUser(userId);
    await db.collection<UserDevice>("user_devices").deleteMany({ userId });

    const result = await db.collection<User>("users").deleteOne({ id: userId });
    if (result.deletedCount !== 1) throw new APIError(404, "User not found");
}

export async function upsertUserDevice(userId: string, device: UserDevice): Promise<UserDevice> {
    const db = getDB();
    const collection = db.collection<UserDevice>("user_devices");

    const filter = { endpoint: device.endpoint };
    const update = {
        $set: {
            userId: userId,
            keys: device.keys,
            deviceName: device.deviceName,
        },
        $setOnInsert: {
            id: randomUUID(),
            createdAt: new Date(),
        },
    };
    const options = { upsert: true, returnDocument: "after" as const };

    const result = await collection.findOneAndUpdate(filter, update, options);
    if (!result) throw new APIError(500, "Failed to update device subscription");

    return result;
}

export async function getUserDevices(userId: string): Promise<UserDevice[]> {
    const db = getDB();
    const result = await db.collection<UserDevice>("userDevices").find({ userId }).toArray();

    return result;
}

export async function deleteUserDevice(userId: string, endpoint: string): Promise<void> {
    const db = getDB();
    const result = await db.collection<UserDevice>("user_devices").deleteOne({ endpoint, userId });
    if (result.deletedCount === 0) throw new APIError(404, "Device not found");
}
