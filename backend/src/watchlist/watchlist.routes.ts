import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
    acceptWatchListInvite,
    createWatchListInvite,
    deleteWatchListById,
    deleteWatchListItem,
    getUserWatchLists,
    getWatchListById,
    getWatchListItems,
    isWatchListOwnedBy,
    upsertWatchList,
    upsertWatchListItem,
} from "./watchlist.adapter";
import { APIError } from "../middleware/error.middleware";
import { WatchList, WatchListItem } from "./watchList.model";

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
    if (!watchlist) throw new APIError(500, "Unexpected error while creating watchlist");

    res.json(watchlist);
});

router.get("/:listId", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params;

    const watchlist = await getWatchListById(listId);
    if (!watchlist) throw new APIError(404, "WatchList not found");

    const canView = await isWatchListOwnedBy(listId, userId, false);
    if (!canView) throw new APIError(403, "Forbidden: You do not have access to this watchlist");

    res.json(watchlist);
});

router.patch("/:listId", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params;
    const updateData = req.body as Partial<WatchList>;

    if (!updateData || Object.keys(updateData).length === 0) throw new APIError(400, "No data provided for update");

    const watchlist = await getWatchListById(listId);
    if (!watchlist) throw new APIError(404, "Watchlist not found");

    const isOwner = await isWatchListOwnedBy(listId, userId, true);
    if (!isOwner) throw new APIError(403, "Forbidden: You do not own this watchlist");

    const updatedWatchlist = await upsertWatchList({ id: watchlist.id, ...updateData }, userId);

    res.json(updatedWatchlist);
});

router.delete("/:listId", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params;

    const isOwner = await isWatchListOwnedBy(listId, userId, true);
    if (!isOwner) throw new APIError(403, "Forbidden: You do not own this watchlist");

    const success = await deleteWatchListById(listId);
    if (!success) throw new APIError(500, "Unexpected error while deleting watchlist");

    res.sendStatus(200);
});

router.get("/:listId/items", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params;

    const watchlist = await getWatchListById(listId);
    if (!watchlist) throw new APIError(404, "Watchlist not found");

    const canView = await isWatchListOwnedBy(listId, userId, false);
    if (!canView) throw new APIError(403, "Forbidden: You do not have access to this watchlist");

    const items = await getWatchListItems(listId);

    res.json({ items });
});

router.post("/:listId/items", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params;
    const { titleId } = req.body as Partial<WatchListItem>;

    const watchlist = await getWatchListById(listId);
    if (!watchlist) throw new APIError(404, "Watchlist not found");

    const canEdit = await isWatchListOwnedBy(listId, userId, false);
    if (!canEdit) throw new APIError(403, "Forbidden: You do not have access to this watchlist");

    const newItem = await upsertWatchListItem(listId, { titleId }, userId);

    res.json(newItem);
});

router.patch("/:listId/items/:itemId", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId, itemId } = req.params;
    const updateData = req.body as Partial<WatchListItem>;

    if (!updateData || Object.keys(updateData).length === 0) throw new APIError(400, "No data provided for update");

    const watchlist = await getWatchListById(listId);
    if (!watchlist) throw new APIError(404, "Watchlist not found");

    const canEdit = await isWatchListOwnedBy(listId, userId, false);
    if (!canEdit) throw new APIError(403, "Forbidden: You do not have access to this watchlist");

    const updatedItem = await upsertWatchListItem(listId, { id: itemId, ...updateData }, userId);
    if (!updatedItem) throw new APIError(404, "WatchListItem not found");

    res.json(updatedItem);
});

router.delete("/:listId/items/:itemId", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId, itemId } = req.params;

    const watchlist = await getWatchListById(listId);
    if (!watchlist) throw new APIError(404, "Watchlist not found");

    const canEdit = await isWatchListOwnedBy(listId, userId, false);
    if (!canEdit) throw new APIError(403, "Forbidden: You do not have access to this watchlist");

    const success = await deleteWatchListItem(listId, itemId);
    if (!success) throw new APIError(404, "WatchListItem not found");

    res.sendStatus(200);
});

router.post("/:listId/invites", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId } = req.params;
    const { inviteeId } = req.body;

    const watchlist = await getWatchListById(listId);
    if (!watchlist) throw new APIError(404, "Watchlist not found");

    const isOwner = await isWatchListOwnedBy(listId, userId, true);
    if (!isOwner) throw new APIError(403, "Forbidden: You are not the owner");

    const invite = await createWatchListInvite(listId, userId, inviteeId);
    if (!invite) throw new APIError(500, "Unexpected error while creating invite");

    res.json(invite);
});

router.post("/invites/:token/accept", authMiddleware, async (req, res) => {
    const userId = (req as any).user?.id;
    const { token } = req.params;

    const result = await acceptWatchListInvite(token, userId);
    if (!result || result == 404) throw new APIError(404, "Invite or related watchlist not found");
    if (result == 400) throw new APIError(400, "This invite is expired");
    if (result == 403) throw new APIError(403, "This invite is not for you");

    res.json(result as WatchList);
});
