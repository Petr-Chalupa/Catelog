import { LOG } from "~~/shared/utils/logger";
import { closeDB, connectDB } from "../utils/db";

export default defineNitroPlugin(async (nitroApp) => {
    try {
        LOG({ level: "INFO", message: "Connecting to DB..." });
        await connectDB();
        LOG({ level: "INFO", message: "DB connected successfully" });
    } catch (err) {
        LOG({ level: "ERROR", message: "DB connection failed", error: err as Error });
        throw err; // FATAL
    }

    nitroApp.hooks.hook("close", async () => {
        LOG({ level: "INFO", message: "Closing DB connection..." });
        await closeDB();
    });
});
