import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
    deleteWatchListById,
    deleteWatchListItem,
    getUserWatchLists,
    getValidatedWatchList,
    getWatchListItemById,
    getWatchListItems,
    transferWatchlist,
    upsertWatchList,
    upsertWatchListItem,
} from "./watchlist.adapter";
import { WatchList, WatchListItem } from "./watchList.model";
import { addItemToWatchList, removeItemFromWatchList, transferWatchListOwnership } from "./watchlists.service";

const router = Router();
export const watchlistsRouter = router;

router.get("/", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const lists = await getUserWatchLists(userId);

    res.json(lists);
});

router.post("/", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { name } = req.body;

    const watchlist = await upsertWatchList({ name }, userId);

    res.json(watchlist);
});

router.get("/:listId", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params as { listId: string };

    const watchlist = await getValidatedWatchList(listId, userId);

    res.json(watchlist);
});

router.patch("/:listId", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params as { listId: string };
    const updateData = req.body as Partial<WatchList>;

    const list = await getValidatedWatchList(listId, userId, true); // Member check
    const updatedWatchlist = await upsertWatchList({ ...list, ...updateData }, userId);

    res.json(updatedWatchlist);
});

router.delete("/:listId", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params as { listId: string };

    await getValidatedWatchList(listId, userId, true); // Owner check
    await deleteWatchListById(listId);

    res.sendStatus(200);
});

router.post("/:listId/transfer", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params as { listId: string };
    const { newOwnerId } = req.body as { newOwnerId: string };

    await getValidatedWatchList(listId, userId, true); // Owner check
    await transferWatchListOwnership(listId, userId, newOwnerId);

    res.sendStatus(200);
});

router.get("/:listId/items", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params as { listId: string };

    await getValidatedWatchList(listId, userId); // Member check
    const items = await getWatchListItems(listId);

    res.json({ items });
});

router.post("/:listId/items", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params as { listId: string };
    const { titleId } = req.body as Partial<WatchListItem>;

    const newItem = await addItemToWatchList(listId, userId, titleId!);

    res.json(newItem);
});

router.patch("/:listId/items/:itemId", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId, itemId } = req.params as { listId: string; itemId: string };
    const updateData = req.body as Partial<WatchListItem>;

    await getValidatedWatchList(listId, userId); // Member check
    const item = await getWatchListItemById(itemId);
    const updatedItem = await upsertWatchListItem(listId, { ...item, ...updateData });

    res.json(updatedItem);
});

router.delete("/:listId/items/:itemId", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId, itemId } = req.params as { listId: string; itemId: string };

    await removeItemFromWatchList(listId, userId, itemId);

    res.sendStatus(200);
});
