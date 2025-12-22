import { Request, Response, NextFunction } from "express";

export class APIError extends Error {
    public readonly timestamp: string;

    constructor(public status: number, message: string) {
        super(message);
        this.name = "APIError";
        this.timestamp = new Date().toISOString();
    }

    public logFormat(req?: any): string {
        const method = req?.method || "N/A";
        const path = req?.path || "N/A";
        return `[${this.timestamp}] ${this.status} - ${method} ${path}: ${this.message}`;
    }
}

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    // OpenAPI validator errors
    if (err.status && err.errors) {
        console.error(`[${new Date().toISOString()}] ${err.status} - ${req.method} ${req.path}: Validation Failed`);
        return res.status(err.status).json({ message: "Validation Failed", errors: err.errors });
    }

    // Custom APIError
    if (err instanceof APIError) {
        console.error(err.logFormat(req));
        return res.status(err.status).json({ message: err.message });
    }

    // Generic errors
    const statusCode = err.status || 500;
    const message = statusCode === 500 ? "Internal Server Error" : err.message;
    console.error(`[${new Date().toISOString()}] ${statusCode} - ${req.method} ${req.path}: ${message}`);
    if (statusCode === 500 && err.stack) console.error(err.stack);
    res.status(statusCode).json({ message });
};
