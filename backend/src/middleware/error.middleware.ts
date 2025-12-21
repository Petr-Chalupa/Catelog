import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${req.method} ${req.path}:`, err.message);

    if (err.name === "UnauthorizedError" || err.status === 401) {
        return res.status(401).json({
            message: "Invalid or missing authentication token",
        });
    }

    if (err.status && err.errors) {
        return res.status(err.status).json({
            message: "Validation Failed",
            errors: err.errors,
        });
    }

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: err.message || "Internal Server Error",
    });
};
