import { Request, Response, NextFunction } from "express";
import { APIError } from "./error.middleware.js";
import { ALLOWED_ORIGINS, getAuth } from "../auth.js";
import { getUserBy_Id } from "../user/user.adapter.js";

export const corsMiddleware = (origin: string | undefined, callback: (err: any, origin?: any) => void) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
    } else {
        callback(new Error("Not allowed by CORS"));
    }
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await getAuth().api.getSession({ headers: req.headers as any, query: req.query });

        if (!session || !session.user) throw new APIError(401, "No authenticated session");

        const user = await getUserBy_Id(session.user.id);
        (req as any).user = user;
        (req as any).session = session.session;

        next();
    } catch (err) {
        throw new APIError(401, "Invalid or expired session");
    }
};

export const systemAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const key = req.header("X-System-Key");

    if (!key || key !== process.env.SYSTEM_MAINTENANCE_KEY) throw new APIError(401, "Invalid system key");

    next();
};
