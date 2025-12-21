import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { deleteUser, upsertUser } from "./user.adapter";
import { handleGoogleAuth, handleMicrosoftAuth } from "./user.service";

const router = Router();
export const userRouter = router;

router.post("/auth/login", async (req, res, next) => {
    try {
        const { token, provider } = req.body;

        if (provider === "google") {
            let { jwt, user } = await handleGoogleAuth(token);
            return res.json({ jwt, user });
        }

        if (provider === "microsoft") {
            let { jwt, user } = await handleMicrosoftAuth(token);
            return res.json({ jwt, user });
        }

        return res.status(400).json({ message: "Unsupported provider" });
    } catch (error) {
        next(error);
    }
});

router.get("/auth/me", authMiddleware, async (req, res) => {
    return res.json((req as any).user);
});

router.patch("/me", authMiddleware, async (req, res, next) => {
    try {
        const updatedUser = await upsertUser((req as any).user);

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json(updatedUser);
    } catch (error) {
        next(error);
    }
});

router.delete("/me", authMiddleware, async (req, res, next) => {
    try {
        const userId = (req as any).user.id;
        const success = await deleteUser(userId);

        if (!success) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});
