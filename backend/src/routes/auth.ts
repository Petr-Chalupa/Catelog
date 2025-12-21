import { Router } from "express";
import { handleGoogleAuth } from "../services/google";
import { authMiddleware } from "../middleware/auth";

const router = Router();
export const authRouter = router;

router.post("/login", async (req, res, next) => {
    try {
        const { token, provider } = req.body;

        if (provider === "google") {
            let { jwt, user } = await handleGoogleAuth(token);
            return res.json({ jwt, user });
        } else {
            return res.status(400).json({ message: "Unsupported provider" });
        }
    } catch (error) {
        next(error);
    }
});

router.get("/me", authMiddleware, (req, res) => {
    res.json((req as any).user);
});
