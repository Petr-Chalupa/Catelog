export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
}

export interface RefreshToken {
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
}
