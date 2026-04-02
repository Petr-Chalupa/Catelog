import { betterAuth, Auth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { APIError } from "./middleware/error.middleware.js";
import { getDB } from "./db.js";
import { upsertUser } from "./user/user.adapter.js";

let auth: Auth<any> | null = null;

export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [];

export function getAuth() {
    if (!auth) throw new APIError(500, "Auth not initialized");
    return auth;
}

export function createAuth() {
    auth = betterAuth({
        database: mongodbAdapter(getDB()),
        user: {
            modelName: "users",
        },
        account: {
            accountLinking: {
                enabled: true,
                trustedProviders: ["google", "microsoft"],
            },
        },
        databaseHooks: {
            user: {
                create: {
                    before: async (user: any) => {
                        // Use custom user creation
                        await upsertUser(user);
                        return false;
                    },
                },
            },
        },
        baseURL: process.env.BASE_URL,
        basePath: "/api/auth",
        secret: process.env.BETTER_AUTH_SECRET,
        trustedOrigins: ALLOWED_ORIGINS,
        session: {
            expiresIn: 60 * 60 * 24 * 7, // 7 days
            updateAge: 60 * 60 * 24, // Update every day
            cookieCache: {
                enabled: true,
                maxAge: 5 * 60, // 5 minutes
            },
        },
        socialProviders: {
            google: {
                enabled: !!process.env.GOOGLE_CLIENT_ID,
                clientId: process.env.GOOGLE_CLIENT_ID || "",
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            },
            microsoft: {
                enabled: !!process.env.MS_CLIENT_ID,
                clientId: process.env.MS_CLIENT_ID || "",
                clientSecret: process.env.MS_CLIENT_SECRET || "",
            },
        },
    });
}
