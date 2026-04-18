import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { defineServerAuth } from "@onmax/nuxt-better-auth/config";

const config = useRuntimeConfig();

export default defineServerAuth({
    database: mongodbAdapter(getDB(), { usePlural: true }),
    appName: "Catelog",
    user: {
        additionalFields: {
            notificationsEnabled: { type: "boolean", required: false, defaultValue: false },
        },
    },
    advanced: {
        database: { generateId: () => crypto.randomUUID() },
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "microsoft"],
        },
    },
    baseURL: config.public.BETTER_AUTH_BASE_URL,
    basePath: "/api/auth",
    secret: config.BETTER_AUTH_SECRET,
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Every day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        },
    },
    socialProviders: {
        google: {
            clientId: config.GOOGLE_CLIENT_ID,
            clientSecret: config.GOOGLE_CLIENT_SECRET,
        },
        microsoft: {
            clientId: config.MS_CLIENT_ID,
            clientSecret: config.MS_CLIENT_SECRET,
        },
    },
});
