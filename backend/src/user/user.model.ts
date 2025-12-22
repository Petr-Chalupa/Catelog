export interface User {
    id: string;
    email: string;
    name?: string;
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
