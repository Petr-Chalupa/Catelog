import { z } from "zod";

/// --- ENUMS --- ///

export const TitleTypeSchema = z.enum(["movie", "series", "other"]);
export type TitleType = z.infer<typeof TitleTypeSchema>;

export const TitleSourceSchema = z.enum(["imdb", "tmdb", "csfd"]);
export type TitleSource = z.infer<typeof TitleSourceSchema>;

export const TitleGenreSchema = z.enum([
    "action",
    "adventure",
    "animation",
    "biography",
    "comedy",
    "crime",
    "documentary",
    "drama",
    "fairytale",
    "family",
    "fantasy",
    "history",
    "horror",
    "musical",
    "mystery",
    "romance",
    "sci_fi",
    "sport",
    "thriller",
    "war",
]);
export type TitleGenre = z.infer<typeof TitleGenreSchema>;

/// --- MERGE --- ///

export const MergeCandidateSchema = z.object({
    externalIds: z.partialRecord(TitleSourceSchema, z.string()).optional(),
    internalId: z.string().optional(),
    displayData: z.object({
        titles: z.record(z.string(), z.string()),
        year: z.number().optional(),
        type: TitleTypeSchema.optional(),
        poster: z.string().optional(),
    }),
});
export type MergeCandidate = z.infer<typeof MergeCandidateSchema>;

/// --- TITLE --- ///

export const TitleDBSchema = z.object({
    _id: z.uuid(),
    type: TitleTypeSchema,
    titles: z.record(z.string(), z.string()),
    poster: z.url().optional(),
    year: z.number().optional(),
    genres: z.array(TitleGenreSchema),
    ratings: z.partialRecord(TitleSourceSchema, z.number()),
    avgRating: z.number().optional(),
    directors: z.array(z.string()),
    actors: z.array(z.string()),
    durationMinutes: z.number().optional(),
    externalIds: z.partialRecord(TitleSourceSchema, z.string()),
    mergeCandidates: z.array(MergeCandidateSchema),
    public: z.boolean(),
    updatedAt: z.coerce.date(),
    createdAt: z.coerce.date(),
});
export type TitleDB = z.infer<typeof TitleDBSchema>;

export const TitlePublicSchema = TitleDBSchema.omit({
    public: true,
    updatedAt: true,
});
export type TitlePublic = z.infer<typeof TitlePublicSchema>;

// Used only internally for public: true titles
export const TitleCreateSchema = TitleDBSchema.omit({
    _id: true,
    public: true,
    mergeCandidates: true,
    updatedAt: true,
    createdAt: true,
});
export type TitleCreate = z.infer<typeof TitleCreateSchema>;

// Used only externally for public: true titles
export const TitleImportSchema = TitleDBSchema.pick({
    externalIds: true,
    type: true,
});
export type TitleImport = z.infer<typeof TitleImportSchema>;

// Used only externally for public: false titles
export const TitleCreatePlaceholderSchema = TitleDBSchema.pick({
    type: true,
    titles: true,
});
export type TitleCreatePlaceholder = z.infer<typeof TitleCreatePlaceholderSchema>;

export const TitleUpdateSchema = TitleDBSchema.omit({
    _id: true,
    updatedAt: true,
    createdAt: true,
})
    .partial()
    .refine(
        (d) =>
            d.type ||
            d.titles ||
            d.poster ||
            d.year ||
            d.genres ||
            d.ratings ||
            d.avgRating ||
            d.directors ||
            d.actors ||
            d.durationMinutes ||
            d.externalIds ||
            d.mergeCandidates ||
            d.public,
        { message: "At least one is required" },
    );
export type TitleUpdate = z.infer<typeof TitleUpdateSchema>;
