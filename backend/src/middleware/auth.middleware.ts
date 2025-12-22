import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { APIError } from "./error.middleware";

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
