import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { APIError } from "./error.middleware.js";

export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [];

export const corsMiddleware = (origin: string | undefined, callback: (err: any, origin?: any) => void) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
    } else {
        callback(new Error("Not allowed by CORS"));
    }
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) throw new APIError(401, "No token provided");

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        (req as any).user = decoded;
        next();
    } catch (err) {
        throw new APIError(401, "Invalid or expired token");
    }
};

export const systemAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const key = req.header("X-System-Key");

    if (!key || key !== process.env.SYSTEM_MAINTENANCE_KEY) throw new APIError(401, "Invalid system key");

    next();
};
