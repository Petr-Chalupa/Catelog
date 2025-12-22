import { randomUUID } from "node:crypto";
import { RefreshToken, User } from "./user.model";
import { db } from "../db";
import { cleanupWatchListsForUser } from "../watchlist/watchlist.adapter";

export async function getUserById(userId: string): Promise<User | null> {
    if (!db) return null;

    const collection = db.collection<User>("users");
    const result = await collection.findOne({ id: userId });

    return result;
}

export async function upsertUser(user: Partial<User>): Promise<User | null> {
    if (!db) return null;

    const collection = db.collection<User>("users");

    const filter = user.id ? { id: user.id } : { email: user.email };
    const update = {
        $set: {
            name: user.name,
            email: user.email,
        },
        $setOnInsert: {
            id: user.id ?? randomUUID(),
            email: user.email!,
            name: user.name,
            createdAt: new Date(),
        },
    };
    const options = { upsert: true, returnDocument: "after" as const };
    const result = await collection.findOneAndUpdate(filter, update, options);

    return result;
}

export async function deleteUser(userId: string): Promise<Boolean> {
    if (!db) return false;

    await cleanupWatchListsForUser(userId);
    const result = await db.collection<User>("users").deleteOne({ id: userId });

    return result.deletedCount === 1;
}

export async function createRefreshToken(userId: string): Promise<string> {
    if (!db) return "";

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.collection<RefreshToken>("refreshTokens").insertOne({
        token,
        userId,
        expiresAt,
        createdAt: new Date(),
    });

    return token;
}

export async function verifyRefreshToken(oldToken: string): Promise<{ token: string; userId: string } | null> {
    if (!db) return null;

    const collection = db.collection<RefreshToken>("refreshTokens");
    const stored = await collection.findOne({ token: oldToken });

    if (!stored || stored.expiresAt < new Date()) {
        if (stored) await collection.deleteOne({ token: oldToken });
        return null;
    }

    await collection.deleteOne({ token: oldToken });
    const newToken = await createRefreshToken(stored.userId);

    return { token: newToken, userId: stored.userId };
}

export async function deleteRefreshToken(token: string): Promise<Boolean> {
    if (!db) return false;

    const collection = db.collection<RefreshToken>("refreshTokens");
    const result = await collection.deleteOne({ token });

    return result.deletedCount === 1;
}
