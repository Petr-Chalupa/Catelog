import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { searchTMDb } from "./providers/tmdb";
import { searchOMDb } from "./providers/omdb";
import { searchCSFD } from "./providers/csfd";
import { Title } from "./title.model";
import { mergeSearchResults } from "./title.service";
import { APIError } from "../middleware/error.middleware";
import { getTitleById, upsertTitle } from "./title.adapter";

const router = Router();
export const titlesRouter = router;

router.post("/", authMiddleware, async (req, res) => {
    const titleData = req.body as Title;

    const title = await upsertTitle(titleData);
    if (!title) throw new APIError(500, "Failed to add title");

    return res.json(title);
});

router.get("/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;

    const title = await getTitleById(id);
    if (!title) throw new APIError(404, "Title not found");

    return res.json(title);
});

router.get("/search", authMiddleware, async (req, res) => {
    const { q } = req.query;
    const query = q as string;

    if (!query?.trim()) throw new APIError(400, "Empty query");

    const results = await Promise.allSettled([searchTMDb(query, true), searchOMDb(query), searchCSFD(query, true)]);

    const flattenedResults = results
        .filter((r): r is PromiseFulfilledResult<Title[]> => r.status === "fulfilled")
        .flatMap((r) => r.value);

    const mergedResults = mergeSearchResults(flattenedResults);

    res.json(mergedResults);
});
