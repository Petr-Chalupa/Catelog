import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
    createRefreshToken,
    deleteRefreshToken,
    deleteUser,
    getUserById,
    upsertUser,
    verifyRefreshToken,
} from "./user.adapter";
import { handleAuth, issueJWT } from "./user.service";
import { APIError } from "../middleware/error.middleware";
import { User } from "./user.model";

const router = Router();
export const userRouter = router;

router.post("/auth/login", async (req, res) => {
    const { token, provider } = req.body;
    const { jwt, user } = await handleAuth(token, provider);
    const refreshToken = await createRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.json({ jwt, user });
});

router.post("/auth/refresh", async (req, res) => {
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken) throw new APIError(401, "Invalid session");

    const result = await verifyRefreshToken(oldRefreshToken);
    if (!result) throw new APIError(401, "Session expired");

    res.cookie("refreshToken", result.token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    const newJwt = issueJWT(result.userId);
    res.json({ jwt: newJwt });
});

router.post("/auth/logout", async (req, res) => {
    const token = req.cookies.refreshToken;

    if (token) {
        await deleteRefreshToken(token);
    }

    res.clearCookie("refreshToken");
    res.sendStatus(200);
});

router.get("/me", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;

    const user = await getUserById(userId);
    if (!user) throw new APIError(404, "User not found");

    return res.json(user);
});

router.patch("/me", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const updateData = req.body as Partial<User>;

    if (!updateData || Object.keys(updateData).length === 0) throw new APIError(400, "No data provided for update");

    const updatedUser = await upsertUser({ id: userId, ...updateData });
    if (!updatedUser) throw new APIError(404, "User not found");

    return res.json(updatedUser);
});

router.delete("/me", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;

    const success = await deleteUser(userId);
    if (!success) throw new APIError(500, "Unexpected error");

    return res.sendStatus(200);
});
