export interface User {
    id: string;
    email: string;
    name?: string;
    notificationsEnabled?: boolean;
    createdAt: Date;
}

export interface OAuthSession {
    state: string;
    codeVerifier: string;
    provider: "google" | "microsoft";
    redirectUrl: string;
    expiresAt: Date;
}

export interface RefreshToken {
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface UserDevice {
    id: string;
    userId: string;
    deviceName?: string;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    createdAt: Date;
}
