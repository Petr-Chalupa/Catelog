import { Router } from "express";
import {
    acceptInvite,
    createInvite,
    declineInvite,
    getInviteByToken,
    getInviteDetails,
    getUserInvites,
} from "./invite.adapter";
import { authMiddleware } from "../middleware/auth.middleware";

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
    const { listId, invitee } = req.body;

    const invite = await createInvite(listId, userId, invitee);

    res.json(invite);
});

router.get("/:token", async (req, res) => {
    const { token } = req.params;

    const invite = await getInviteByToken(token);
    const details = await getInviteDetails(invite.id);

    res.json({ ...invite, ...details });
});

router.post("/:token/accept", authMiddleware, async (req, res) => {
    const userId = (req as any).user?.id;
    const { token } = req.params;

    const result = await acceptInvite(token, userId);

    res.json(result);
});

router.post("/:id/decline", authMiddleware, async (req, res) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    await declineInvite(id, userId);

    res.sendStatus(200);
});
