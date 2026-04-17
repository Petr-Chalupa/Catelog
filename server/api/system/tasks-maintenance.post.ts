export default defineEventHandler(async (event) => {
    LOG({ level: "INFO", message: "[Maintenance] Cleanup task started" });

    const [deletedTitles, _] = await Promise.all([deleteUnreferencedTitlePlaceholders(), deleteExpired()]);

    LOG({
        level: "INFO",
        message: "[Maintenance] Cleanup successful",
        context: {
            deletedPlaceholders: deletedTitles,
        },
    });

    return {
        message: "Maintenance complete",
        stats: {
            placeholders: deletedTitles,
        },
    };
});
