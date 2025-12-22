import { Request, Response, NextFunction } from "express";

export class APIError extends Error {
    public readonly timestamp: string;

    constructor(public status: number, message: string) {
        super(message);
        this.name = "APIError";
        this.timestamp = new Date().toISOString();
    }

    public log(req?: any): string {
        const method = req?.method || "N/A";
        const path = req?.path || "N/A";
        return `[${this.timestamp}] ${this.status} - ${method} ${path}: ${this.message}`;
    }
}

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof APIError) {
        console.error(err.log(req));
    } else {
        console.error(`[${new Date().toISOString()}] 500 - ${req.method} ${req.path}:`, err.message);
        if (err.stack) console.error(err.stack);
    }

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
    const message = statusCode === 500 ? "Internal Server Error" : err.message;
    res.status(statusCode).json({ message });
};
