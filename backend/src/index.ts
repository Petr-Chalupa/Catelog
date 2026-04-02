import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import { fileURLToPath } from "url";
import { toNodeHandler } from "better-auth/node";
import * as OpenApiValidator from "express-openapi-validator";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
//
import { createAuth, getAuth } from "./auth.js";
import { connectDB, closeDB } from "./db.js";
import { corsMiddleware } from "./middleware/auth.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { systemRouter } from "./system/system.routes.js";
import { userRouter } from "./user/user.routes.js";
import { titlesRouter } from "./title/title.routes.js";
import { watchlistsRouter } from "./watchlist/watchlist.routes.js";
import { invitesRouter } from "./invite/invite.routes.js";

const apiSpecPath = fileURLToPath(import.meta.resolve("../openapi.yaml"));
const apiSwaggerDocument = YAML.parse(fs.readFileSync(apiSpecPath, "utf8"));
const app = express();

(async () => {
    try {
        await connectDB();
        createAuth();

        // Common middleware
        app.use(cors({ origin: corsMiddleware, credentials: true }));
        app.use(cookieParser());
        app.use(
            OpenApiValidator.middleware({
                apiSpec: apiSpecPath,
                validateRequests: true,
                validateResponses: false,
                ignorePaths: /\/api\/auth\//,
            }),
        );

        // API Auth routes (must be handled before JSON middleware)
        app.all("/api/auth/{*any}", toNodeHandler(getAuth()));

        // JSON middleware
        app.use(express.json());

        // API routes
        app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(apiSwaggerDocument, { customSiteTitle: "Catelog API" }));
        app.use("/api/system", systemRouter);
        app.use("/api/user", userRouter);
        app.use("/api/titles", titlesRouter);
        app.use("/api/watchlists", watchlistsRouter);
        app.use("/api/invites", invitesRouter);

        // Global error handler
        app.use(errorMiddleware);

        const port = process.env.PORT || 3000;
        app.listen(port, () => console.log(`Server running on PORT: ${port}`));
    } catch (err) {
        console.error("Failed to start server", err);
        process.exit(1);
    }
})();

process.on("SIGINT", async () => {
    await closeDB();
    console.log("Server stopped");
    process.exit(0);
});
