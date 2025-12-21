import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { searchTMDb } from "./providers/tmdb";
import { searchOMDb } from "./providers/omdb";
import { searchCSFD } from "./providers/csfd";
import { Title } from "./title.model";
import { mergeSearchResults } from "./title.service";

const router = Router();
export const titlesRouter = router;

router.get("/search", authMiddleware, async (req, res, next) => {
    try {
        const { q } = req.query;
        const query = q as string;

        const results = await Promise.allSettled([searchTMDb(query, true), searchOMDb(query), searchCSFD(query, true)]);

        const flattenedResults = results
            .filter((r): r is PromiseFulfilledResult<Title[]> => r.status === "fulfilled")
            .flatMap((r) => r.value);

        const mergedResults = mergeSearchResults(flattenedResults);

        res.json(mergedResults);
    } catch (error) {
        next(error);
    }
});
