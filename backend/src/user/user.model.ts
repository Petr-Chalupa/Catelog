export interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    name?: string;
    image?: string;
    notificationsEnabled?: boolean;
    createdAt: Date;
    updatedAt: Date;
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
