import { z } from "zod";

/// --- USER --- ///

export const UserDBSchema = z.object({
    _id: z.uuid(),
    email: z.email(),
    emailVerified: z.boolean(),
    name: z.string().optional(),
    image: z.url().optional(),
    notificationsEnabled: z.boolean().default(false),
    updatedAt: z.coerce.date(),
    createdAt: z.coerce.date(),
});
export type UserDB = z.infer<typeof UserDBSchema>;

export const UserPublicSchema = UserDBSchema.omit({
    emailVerified: true,
    updatedAt: true,
});
export type UserPublic = z.infer<typeof UserPublicSchema>;

export const UserPublicMinimalSchema = UserPublicSchema.omit({
    email: true,
    notificationsEnabled: true,
    createdAt: true,
});
export type UserPublicMinimal = z.infer<typeof UserPublicMinimalSchema>;

export const UserUpdateSchema = UserDBSchema.omit({
    _id: true,
    email: true,
    emailVerified: true,
    name: true,
    updatedAt: true,
    createdAt: true,
})
    .partial()
    .refine((d) => d.image || d.notificationsEnabled !== undefined, { message: "At least one is required" });
export type UserUpdate = z.infer<typeof UserUpdateSchema>;

export const UserQuerySchema = UserDBSchema.pick({
    _id: true,
    email: true,
    name: true,
})
    .partial()
    .refine((d) => d._id || d.email || d.name, { error: "At least one is required" });
export type UserQuery = z.infer<typeof UserQuerySchema>;

/// --- DEVICE --- ///

export const UserDeviceDBSchema = z.object({
    _id: z.uuid(),
    userId: z.uuid(),
    deviceName: z.string(),
    endpoint: z.url(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
    }),
    updatedAt: z.coerce.date(),
    createdAt: z.coerce.date(),
});
export type UserDeviceDB = z.infer<typeof UserDeviceDBSchema>;

export const UserDevicePublicSchema = UserDeviceDBSchema.omit({
    endpoint: true,
    keys: true,
    updatedAt: true,
});
export type UserDevicePublic = z.infer<typeof UserDevicePublicSchema>;

export const UserDeviceCreateSchema = UserDeviceDBSchema.pick({
    userId: true,
    deviceName: true,
    endpoint: true,
    keys: true,
});
export type UserDeviceCreate = z.infer<typeof UserDeviceCreateSchema>;

export const UserDeviceUpdateSchema = UserDeviceDBSchema.pick({
    deviceName: true,
});
export type UserDeviceUpdate = z.infer<typeof UserDeviceUpdateSchema>;
