import express from "express";
import cron from "node-cron";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import * as OpenApiValidator from "express-openapi-validator";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import * as dotenv from "dotenv";
dotenv.config();

// Imports that might depend on env vars
import { connectDB, closeDB, deleteExpired } from "./db";
import { errorMiddleware } from "./middleware/error.middleware";
import { userRouter } from "./user/user.routes";
import { titlesRouter } from "./title/title.routes";
import { watchlistsRouter } from "./watchlist/watchlist.routes";
import { deleteUnreferencedTitlePlaceholders } from "./title/title.adapter";
import { runEnrichment } from "./title/title.service";

const apiSpecPath = path.join(__dirname, "../openapi.yaml");
const apiSwaggerDocument = YAML.parse(fs.readFileSync(apiSpecPath, "utf8"));
const app = express();

// Common middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(
    OpenApiValidator.middleware({
        apiSpec: apiSpecPath,
        validateRequests: true,
        validateResponses: false,
        ignorePaths: /\/api\/(docs|user\/auth\/google\/callback|user\/auth\/microsoft\/callback)/,
    })
);

// API routes
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(apiSwaggerDocument, { customSiteTitle: "Catelog API" }));
app.use("/api/user", userRouter);
app.use("/api/titles", titlesRouter);
app.use("/api/watchlists", watchlistsRouter);

// Global error handler
app.use(errorMiddleware);

// Periodic runs
async function schedule() {
    // Every week
    cron.schedule("0 0 * * 0", async () => {
        await runEnrichment();
    });

    // Every month
    cron.schedule("0 0 1 * *", async () => {
        await deleteUnreferencedTitlePlaceholders();
        await deleteExpired();
    });
}

// Lifecycle
(async () => {
    try {
        await connectDB();
        schedule();

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
