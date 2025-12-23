import { Router } from "express";
import { runEnrichment } from "../title/title.service";
import { deleteUnreferencedTitlePlaceholders } from "../title/title.adapter";
import { deleteExpired } from "../db";
import { systemAuthMiddleware } from "../middleware/auth.middleware";

const router = Router();
export const systemRouter = router;

router.post("/tasks/enrich", systemAuthMiddleware, async (req, res) => {
    await runEnrichment();
    return res.json({ message: "Enrichment task initiated" });
});

router.post("/tasks/maintenance", systemAuthMiddleware, async (req, res) => {
    await deleteUnreferencedTitlePlaceholders();
    await deleteExpired();
    return res.json({ message: "Maintenance complete" });
});
