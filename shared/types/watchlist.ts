import { z } from "zod";
import { TitleGenreSchema, TitlePublicSchema, type TitleGenre, type TitleType } from "./title";
import { UserPublicMinimalSchema } from "./user";

/// --- LIST --- ///

export type WatchlistFilters = {
    search?: string;
    states?: Record<WatchState, string>;
    genres?: Record<TitleGenre, string>;
    types?: Record<TitleType, string>;
    maxDuration?: number;
    minRating?: number;
    minYear?: number;
    maxYear?: number;
    directors?: Record<string, string>;
    actors?: Record<string, string>;
};

export const WatchlistDBSchema = z.object({
    _id: z.uuid(),
    name: z.string(),
    ownerId: z.uuid(),
    sharedWith: z.array(z.uuid()),
    sortKey: z.string(),
    updatedAt: z.coerce.date(),
    createdAt: z.coerce.date(),
});
export type WatchlistDB = z.infer<typeof WatchlistDBSchema>;

export const WatchlistPublicSchema = WatchlistDBSchema.omit({
    ownerId: true,
    sharedWith: true,
    updatedAt: true,
}).extend({
    owner: UserPublicMinimalSchema,
    sharedWith: z.array(UserPublicMinimalSchema),
});
export type WatchlistPublic = z.infer<typeof WatchlistPublicSchema>;

export const WatchlistCreateSchema = WatchlistDBSchema.pick({
    name: true,
    ownerId: true,
    sortKey: true,
});
export type WatchlistCreate = z.infer<typeof WatchlistCreateSchema>;

export const WatchlistUpdateSchema = WatchlistDBSchema.omit({
    _id: true,
    updatedAt: true,
    createdAt: true,
})
    .partial()
    .refine((d) => d.name || d.ownerId || d.sharedWith || d.sortKey, {
        message: "At least one is required",
    });
export type WatchlistUpdate = z.infer<typeof WatchlistUpdateSchema>;

/// --- ITEM --- ///

export const WatchStateSchema = z.enum(["planned", "started", "finished"]);
export type WatchState = z.infer<typeof WatchStateSchema>;

export const WatchlistItemDBSchema = z.object({
    _id: z.uuid(),
    listId: z.uuid(),
    titleId: z.uuid(),
    state: WatchStateSchema,
    addedGenres: z.array(TitleGenreSchema),
    excludedGenres: z.array(TitleGenreSchema),
    personalRating: z.number().optional(),
    addedById: z.uuid(),
    sortKey: z.string(),
    updatedAt: z.coerce.date(),
    createdAt: z.coerce.date(),
});
export type WatchlistItemDB = z.infer<typeof WatchlistItemDBSchema>;

export const WatchlistItemPublicSchema = WatchlistItemDBSchema.omit({
    titleId: true,
    addedById: true,
    updatedAt: true,
}).extend({
    title: TitlePublicSchema,
    addedBy: UserPublicMinimalSchema,
});
export type WatchlistItemPublic = z.infer<typeof WatchlistItemPublicSchema>;

export const WatchlistItemCreateSchema = WatchlistItemDBSchema.pick({
    listId: true,
    titleId: true,
    addedById: true,
    sortKey: true,
});
export type WatchlistItemCreate = z.infer<typeof WatchlistItemCreateSchema>;

export const WatchlistItemUpdateSchema = WatchlistItemDBSchema.omit({
    _id: true,
    listId: true,
    addedById: true,
    updatedAt: true,
    createdAt: true,
})
    .partial()
    .refine(
        (d) => d.state || d.titleId || d.addedGenres || d.excludedGenres || d.personalRating !== undefined || d.sortKey,
        {
            message: "At least one is required",
        },
    );
export type WatchlistItemUpdate = z.infer<typeof WatchlistItemUpdateSchema>;
