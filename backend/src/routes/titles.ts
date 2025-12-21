import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { upsertTitle } from "../db";
import type { Title } from "../models/Title";
import { mergeSearchResults, searchCSFD, searchOMDb, searchTMDb } from "../services/data";

const router = Router();
export const titlesRouter = router;

router.get("/search", async (req, res, next) => {
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
