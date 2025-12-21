import { randomUUID } from "node:crypto";
import { User } from "./user.model";
import { db } from "../db";

export async function upsertUser(user: Partial<User>): Promise<User | null> {
    if (!db) return null;

    const collection = db.collection<User>("users");

    const existingUser = await collection.findOne({ email: user.email });
    if (existingUser) {
        return existingUser;
    }

    const newUser: User = {
        id: randomUUID(),
        email: user.email!,
        name: user.name,
        createdAt: new Date(),
    };
    await collection.insertOne(newUser);

    return newUser;
}

export async function deleteUser(userId: string): Promise<Boolean> {
    if (!db) return false;

    const collection = db.collection<User>("users");
    const result = await collection.deleteOne({ id: userId });

    return result.deletedCount === 1;
}
