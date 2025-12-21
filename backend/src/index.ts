import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import * as OpenApiValidator from "express-openapi-validator";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import * as dotenv from "dotenv";
dotenv.config();

// Imports that might depend on env vars
import { connectDB, closeDB } from "./db";
import { errorMiddleware } from "./middleware/error.middleware";
import { authRouter } from "./auth/auth.routes";
import { titlesRouter } from "./title/title.routes";

const apiSpecPath = path.join(__dirname, "../openapi.yaml");
const apiSwaggerDocument = YAML.parse(fs.readFileSync(apiSpecPath, "utf8"));
const app = express();

// Common middleware
app.use(cors());
app.use(express.json());
app.use(
    OpenApiValidator.middleware({
        apiSpec: apiSpecPath,
        validateRequests: true,
        validateResponses: true,
        ignorePaths: /^\/api\/docs/,
    })
);

// API routes
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(apiSwaggerDocument));
app.use("/api/auth", authRouter);
app.use("/api/titles", titlesRouter);

// Global error handler
app.use(errorMiddleware);

// Lifecycle
(async () => {
    try {
        await connectDB();
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
