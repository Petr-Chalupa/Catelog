import { randomUUID } from "node:crypto";
import { OAuthSession, RefreshToken, User, UserDevice } from "./user.model";
import { getDB } from "../db";
import { cleanupWatchListsForUser } from "../watchlist/watchlist.adapter";
import { APIError } from "../middleware/error.middleware";

export async function getUserById(userId: string): Promise<User> {
    const db = getDB();
    const user = await db.collection<User>("users").findOne({ id: userId });
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
            notificationsEnabled: user.notificationsEnabled,
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

export async function createOAuthSession(session: Omit<OAuthSession, "expiresAt">): Promise<OAuthSession> {
    const db = getDB();
    const newSession: OAuthSession = {
        ...session,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
    };

    const result = await db.collection<OAuthSession>("oauth_sessions").insertOne(newSession);
    if (!result.acknowledged) throw new APIError(500, "Failed to create OAuth session");

    return newSession;
}

export async function getOAuthSession(state: string): Promise<OAuthSession> {
    const db = getDB();
    const result = await db.collection<OAuthSession>("oauth_sessions").findOne({ state });
    if (!result) throw new APIError(401, "Invalid or expired OAuth state");

    return result;
}

export async function deleteOAuthSession(state: string): Promise<void> {
    const db = getDB();
    const result = await db.collection<OAuthSession>("oauth_sessions").deleteOne({ state });
    if (result.deletedCount === 0) throw new APIError(404, "User not found");
}

export async function createRefreshToken(userId: string): Promise<string> {
    const db = getDB();
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await db.collection<RefreshToken>("refresh_tokens").insertOne({
        token,
        userId,
        expiresAt,
        createdAt: new Date(),
    });

    return token;
}

export async function verifyRefreshToken(oldToken: string): Promise<{ token: string; userId: string }> {
    const db = getDB();
    const collection = db.collection<RefreshToken>("refresh_tokens");
    const stored = await collection.findOne({ token: oldToken });

    if (!stored || stored.expiresAt < new Date()) {
        if (stored) await collection.deleteOne({ token: oldToken });
        throw new APIError(401, "Session expired");
    }

    await collection.deleteOne({ token: oldToken });
    const newToken = await createRefreshToken(stored.userId);

    return { token: newToken, userId: stored.userId };
}

export async function deleteRefreshToken(token: string): Promise<void> {
    const db = getDB();
    const result = await db.collection<RefreshToken>("refresh_tokens").deleteOne({ token });
    if (result.deletedCount !== 1) throw new APIError(404, "Refresh token not found");
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
