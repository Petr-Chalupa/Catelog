import { Router } from "express";
import { ALLOWED_ORIGINS, authMiddleware } from "../middleware/auth.middleware";
import {
    deleteRefreshToken,
    deleteUser,
    deleteUserDevice,
    getUserById,
    upsertUser,
    upsertUserDevice,
    verifyRefreshToken,
} from "./user.adapter";
import {
    finishGoogleOAuth,
    finishMicrosoftOAuth,
    issueJWT,
    startGoogleOAuth,
    startMicrosoftOAuth,
} from "./user.service";
import { APIError } from "../middleware/error.middleware";
import { User, UserDevice } from "./user.model";

const router = Router();
export const userRouter = router;

router.get("/auth", async (req, res) => {
    const { provider, redirect } = req.query as { provider: string; redirect: string };

    const isSafe = ALLOWED_ORIGINS.some((origin) => redirect.startsWith(origin));
    if (!isSafe) throw new APIError(403, "Forbidden: Redirect URL not whitelisted");

    if (provider === "google") return res.redirect(await startGoogleOAuth(redirect));
    if (provider === "microsoft") return res.redirect(await startMicrosoftOAuth(redirect));

    throw new APIError(400, "Unsupported provider");
});

router.get("/auth/google/callback", async (req, res) => {
    const { code, state } = req.query as { code: string; state: string };

    const result = await finishGoogleOAuth(code, state);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.redirect(result.redirectUrl);
});

router.get("/auth/microsoft/callback", async (req, res) => {
    const { code, state } = req.query as { code: string; state: string };

    const result = await finishMicrosoftOAuth(code, state);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.redirect(result.redirectUrl);
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

    const jwt = issueJWT(result.userId);
    res.json({ accessToken: jwt });
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

router.post("/devices/subscribe", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const deviceData = req.body as UserDevice;

    await upsertUserDevice(userId, deviceData);

    return res.sendStatus(200);
});

router.post("/devices/unsubscribe", authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { endpoint } = req.body as { endpoint: string };

    const success = await deleteUserDevice(userId, endpoint);
    if (!success) throw new APIError(500, "Unexpected error");

    return res.sendStatus(200);
});
