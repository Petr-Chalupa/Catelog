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
    const timestamp = new Date().toISOString();

    // OpenAPI validator errors
    if (err.status && err.errors) {
        console.error(`[${timestamp}] ${err.status} ${req.method} ${req.path}: Validation Failed`);
        return res.status(err.status).json({ message: "Validation Failed", errors: err.errors });
    }

    // Custom APIError
    if (err instanceof APIError) {
        console.error(err.logFormat(req));
        return res.status(err.status).json({ message: err.message });
    }

    // Generic errors
    console.error(`[${timestamp}] ${err.status || 500} ${req.method} ${req.path}: UNEXPECTED SYSTEM ERROR:`, err);
    return res.status(500).json({
        message: "Internal Server Error",
        internalCode: err.status
            ? `HTTP_${err.status}_${err.code || err.name || "ERR"}`
            : err.code || err.name || "UNKNOWN_ERROR",
    });
};
