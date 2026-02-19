import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { searchTMDb } from "./providers/tmdb.js";
import { searchOMDb } from "./providers/omdb.js";
import { searchCSFD } from "./providers/csfd.js";
import { Title } from "./title.model.js";
import { importTitle, mergeSearchResults, refreshTitleMetadata, updatePlaceholderMergeCandidates } from "./title.service.js";
import { getTitleById, upsertTitle } from "./title.adapter.js";

const router = Router();
export const titlesRouter = router;

router.post("/", authMiddleware, async (req, res) => {
    const titleData = req.body as Partial<Title>;

    const title = await upsertTitle(titleData);
    if (!title.public) {
        // Run in background
        updatePlaceholderMergeCandidates(title.id).catch((err) => console.error(`Background discovery failed for ${title.id}:`, err));
    }

    return res.json(title);
});

router.post("/import", authMiddleware, async (req, res) => {
    const { externalIds, type } = req.body;

    const importedTitle = await importTitle(externalIds, type);

    return res.json(importedTitle);
});

router.get("/search", authMiddleware, async (req, res) => {
    const { q } = req.query;
    const query = q as string;

    const results = await Promise.allSettled([searchTMDb(query, true), searchOMDb(query), searchCSFD(query, true)]);
    const flattenedResults = results.filter((r): r is PromiseFulfilledResult<Title[]> => r.status === "fulfilled").flatMap((r) => r.value);
    const mergedResults = mergeSearchResults(flattenedResults);

    res.json(mergedResults);
});

router.get("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params as { id: string };

    const title = await getTitleById(id);

    return res.json(title);
});

router.post("/:id/refresh", authMiddleware, async (req, res) => {
    const { id } = req.params as { id: string };

    // Only one will actually run
    await refreshTitleMetadata(id);
    await updatePlaceholderMergeCandidates(id);

    const updated = await getTitleById(id);
    res.json(updated);
});
