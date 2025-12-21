import { randomUUID } from "node:crypto";
import { Title } from "./title.model";
import { mergeTitle } from "./title.service";
import { db } from "../db";

function buildTitleSearchQuery(title: Title): any[] {
    const ors: any[] = [];

    if (title.externalIds) {
        Object.entries(title.externalIds).forEach(([source, id]) => {
            if (id) ors.push({ [`externalIds.${source}`]: id });
        });
    }

    const titleVariations = new Set<string>([title.title]);
    if (title.localizedTitles) {
        Object.values(title.localizedTitles).forEach((val) => titleVariations.add(val));
    }
    titleVariations.forEach((t) => {
        ors.push({ title: t, ...(title.year && { year: title.year }) });
        ors.push({ localizedTitles: { $elemMatch: { $eq: t } }, ...(title.year && { year: title.year }) });
    });

    return ors;
}

export async function upsertTitle(title: Title): Promise<Title | null> {
    if (!db) return null;

    const collection = db.collection<Title>("titles");
    const existing = await collection.findOne({ public: true, $or: buildTitleSearchQuery(title) });

    if (existing) {
        const merged = mergeTitle(existing, title);
        await collection.replaceOne({ id: merged.id }, merged);
        return merged;
    } else {
        const newTitle: Title = {
            ...title,
            id: title.id || randomUUID(),
            updatedAt: new Date(),
            createdAt: new Date(),
        };
        await collection.insertOne(newTitle);
        return newTitle;
    }
}

export async function updateTitlePlaceholders() {
    if (!db) return;

    const collection = db.collection<Title>("titles");
    const placeholders = await collection.find({ public: false }).toArray();

    for (const ph of placeholders) {
        const matches = await collection.find({ public: true, $or: buildTitleSearchQuery(ph) }).toArray();

        ph.mergeCandidates = [];
        for (const match of matches) {
            ph.mergeCandidates.push(match.id);
        }

        await collection.replaceOne({ id: ph.id }, ph);
    }
}

export async function findTitlesForEnrichment(): Promise<Title[]> {
    if (!db) return [];

    return db
        .collection<Title>("titles")
        .find({
            public: true,
            $or: [
                { avgRating: { $exists: false } },
                { poster: { $exists: false } },
                { localizedTitles: { $exists: false } },
                { updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            ],
        })
        .toArray();
}
