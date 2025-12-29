import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { searchTMDb } from "./providers/tmdb";
import { searchOMDb } from "./providers/omdb";
import { searchCSFD } from "./providers/csfd";
import { Title } from "./title.model";
import { mergeSearchResults, refreshTitleMetadata, updatePlaceholderMergeCandidates } from "./title.service";
import { getTitleById, upsertTitle } from "./title.adapter";

const router = Router();
export const titlesRouter = router;

router.post("/", authMiddleware, async (req, res) => {
    const titleData = req.body as Partial<Title>;

    const title = await upsertTitle(titleData);
    if (!title.public) {
        // Run in background
        updatePlaceholderMergeCandidates(title.id).catch((err) =>
            console.error(`Background discovery failed for ${title.id}:`, err)
        );
    }

    return res.json(title);
});

router.get("/search", authMiddleware, async (req, res) => {
    const { q } = req.query;
    const query = q as string;

    const results = await Promise.allSettled([searchTMDb(query, true), searchOMDb(query), searchCSFD(query, true)]);
    const flattenedResults = results
        .filter((r): r is PromiseFulfilledResult<Title[]> => r.status === "fulfilled")
        .flatMap((r) => r.value);
    const mergedResults = mergeSearchResults(flattenedResults);

    res.json(mergedResults);
});

router.get("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    const title = await getTitleById(id);

    return res.json(title);
});

router.post("/:id/refresh", authMiddleware, async (req, res) => {
    const { id } = req.params;

    // Only one will actually run
    await refreshTitleMetadata(id);
    await updatePlaceholderMergeCandidates(id);

    const updated = await getTitleById(id);
    res.json(updated);
});
