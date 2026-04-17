import { z } from "zod";
import { UserPublicMinimalSchema } from "./user";
import { WatchlistPublicSchema } from "./watchlist";

export const InviteTypeSchema = z.enum(["incoming", "outgoing"]);
export type InviteType = z.infer<typeof InviteTypeSchema>;

export const InviteDBSchema = z.object({
    _id: z.uuid(),
    listId: z.uuid(),
    inviterId: z.uuid(),
    inviteeId: z.uuid(),
    token: z.string(),
    expiresAt: z.coerce.date(),
    createdAt: z.coerce.date(),
});
export type InviteDB = z.infer<typeof InviteDBSchema>;

export const InvitePublicSchema = InviteDBSchema.omit({
    listId: true,
    inviterId: true,
    inviteeId: true,
    token: true,
}).extend({
    list: WatchlistPublicSchema,
    inviter: UserPublicMinimalSchema,
    invitee: UserPublicMinimalSchema,
});
export type InvitePublic = z.infer<typeof InvitePublicSchema>;

export const InviteCreateSchema = InviteDBSchema.pick({
    listId: true,
    inviterId: true,
    inviteeId: true,
});
export type InviteCreate = z.infer<typeof InviteCreateSchema>;
