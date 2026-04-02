import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
    deleteUser,
    deleteUserDevice,
    getUserByEmail,
    getUserById,
    upsertUser,
    upsertUserDevice,
} from "./user.adapter.js";
import { APIError } from "../middleware/error.middleware.js";
import { User, UserDevice } from "./user.model.js";

const router = Router();
export const userRouter = router;

router.get("/", authMiddleware, async (req, res) => {
    const { id, email } = req.query as { id?: string; email?: string };

    if (!id && !email) throw new APIError(400, "At least one of the parameters is required");
    const user = id ? await getUserById(id) : await getUserByEmail(email!);

    return res.json(user);
});

router.get("/me", authMiddleware, async (req, res) => {
    return res.json((req as any).user);
});

router.patch("/me", authMiddleware, async (req, res) => {
    const user = (req as any).user;
    const updateData = req.body as Partial<User>;

    const updatedUser = await upsertUser({ ...user, ...updateData });

    return res.json(updatedUser);
});

router.delete("/me", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;

    await deleteUser(userId);

    return res.sendStatus(200);
});

router.post("/devices/subscribe", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const deviceData = req.body as UserDevice;

    await upsertUserDevice(userId, deviceData);

    return res.sendStatus(200);
});

router.post("/devices/unsubscribe", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { endpoint } = req.body as { endpoint: string };

    await deleteUserDevice(userId, endpoint);

    return res.sendStatus(200);
});
