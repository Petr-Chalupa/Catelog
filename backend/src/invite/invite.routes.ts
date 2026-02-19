import { Router } from "express";
import { declineInvite, getInviteByToken, getInviteDetails, getUserInvites, getWatchlistInvites } from "./invite.adapter.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { inviteUserToWatchlist, processAcceptInvite } from "./invite.service.js";

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
        }),
    );

    res.json(enrichedInvites);
});

router.post("/", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { listId, invitee } = req.body;

    const invite = await inviteUserToWatchlist(listId, userId, invitee);

    res.json(invite);
});

router.get("/watchlists/:id", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { id } = req.params as { id: string };

    const invites = await getWatchlistInvites(userId, id);
    const enrichedInvites = await Promise.all(
        invites.map(async (invite) => {
            const details = await getInviteDetails(invite.id);
            return { ...invite, ...details };
        }),
    );

    res.json(enrichedInvites);
});

router.get("/:token", async (req, res) => {
    const { token } = req.params;

    const invite = await getInviteByToken(token);
    const details = await getInviteDetails(invite.id);

    res.json({ ...invite, ...details });
});

router.post("/:token/accept", authMiddleware, async (req, res) => {
    const userId = (req as any).user?.id;
    const { token } = req.params as { token: string };

    const result = await processAcceptInvite(token, userId);

    res.json(result);
});

router.delete("/:id/decline", authMiddleware, async (req, res) => {
    const userId = (req as any).user?.id;
    const { id } = req.params as { id: string };

    await declineInvite(id, userId);

    res.sendStatus(200);
});
