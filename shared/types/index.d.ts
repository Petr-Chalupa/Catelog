import type { Session, User } from "better-auth";

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
}

export interface Toast {
    id: string;
    message: string;
    type: "error" | "warn" | "success" | "info";
    timeout?: number;
}

declare global {
    interface NotificationOptions {
        vibrate?: number[];
    }
}

declare module "nuxt/schema" {
    interface RuntimeConfig {
        MONGO_URI: string;
        MONGO_DB: string;
        BETTER_AUTH_SECRET: string;
        SYSTEM_MAINTENANCE_KEY: string;
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        MS_CLIENT_ID: string;
        MS_CLIENT_SECRET: string;
        TMDB_API_KEY: string;
        TMDB_BASE_URL: string;
        OMDB_API_KEY: string;
        OMDB_BASE_URL: string;
        VAPID_PRIVATE_KEY: string;
        VAPID_SUBJECT: string;
    }
    interface PublicRuntimeConfig {
        ENV: string;
        BETTER_AUTH_BASE_URL: string;
        VAPID_PUBLIC_KEY: string;
    }
}

declare module "h3" {
    interface H3EventContext {
        startTime: number;
        requestId: string;
        user?: User;
        session?: Session;
    }
}
