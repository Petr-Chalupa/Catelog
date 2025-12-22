import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { deleteWatchlistById, isWatchlistOwnedBy } from "./watchlist.adapter";

const router = Router();
export const watchlistsRouter = router;

router.delete("/:listId", authMiddleware, async (req, res, next) => {
    try {
        const userId = (req as any).user.id;
        const listId = req.params.listId;

        const isOwner = await isWatchlistOwnedBy(listId, userId);
        if (!isOwner) {
            return res.status(403);
        }

        const success = await deleteWatchlistById(listId);
        if (!success) {
            return res.status(404).json({ message: "Watchlist not found or unauthorized" });
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});
