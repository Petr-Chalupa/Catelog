import { Router } from "express";
import { getWatchListById, isWatchListOwnedBy } from "../watchlist/watchlist.adapter";
import { APIError } from "../middleware/error.middleware";
import { acceptInvite, createInvite, getInviteDetails, getUserInvites } from "./invite.adapter";
import { authMiddleware } from "../middleware/auth.middleware";
import { WatchList } from "../watchlist/watchList.model";

const router = Router();
export const invitesRouter = router;

router.get("/", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { t } = req.query;
    const type = t as string;

    const invites = await getUserInvites(userId, type);
    const enrichedInvites = await Promise.all(
        invites.map(async (invite) => {
            const details = await getInviteDetails(invite.id);
            return { ...invite, ...details };
        })
    );

    res.json(enrichedInvites);
});

router.post("/", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId, inviteeId } = req.body;

    const watchlist = await getWatchListById(listId);
    if (!watchlist) throw new APIError(404, "Watchlist not found");

    const isOwner = await isWatchListOwnedBy(listId, userId, true);
    if (!isOwner) throw new APIError(403, "Forbidden: You are not the owner");

    const invite = await createInvite(listId, userId, inviteeId);
    if (!invite) throw new APIError(500, "Unexpected error while creating invite");

    res.json(invite);
});

router.post("/:token/accept", authMiddleware, async (req, res) => {
    const userId = (req as any).user?.id;
    const { token } = req.params;

    const result = await acceptInvite(token, userId);
    if (!result || result == 404) throw new APIError(404, "Invite or related watchlist not found");
    if (result == 400) throw new APIError(400, "This invite is expired");
    if (result == 403) throw new APIError(403, "This invite is not for you");

    res.json(result as WatchList);
});
