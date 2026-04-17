export default defineEventHandler(async (event) => {
    LOG({ level: "INFO", message: "[Enrichment] Enrichment task started" });

    const publicTitles = await getTitlesForEnrichment();
    LOG({ level: "INFO", message: `[Enrichment] Refreshing ${publicTitles.length} public titles...` });
    for (const title of publicTitles) {
        try {
            await refreshTitleMetadata(title._id);
        } catch (e) {
            LOG({
                level: "ERROR",
                message: `[Enrichment] Failed to refresh title ${title._id}`,
                context: { error: e },
            });
        }
        await new Promise((resolve) => setTimeout(resolve, 250)); // Rate limiting
    }

    const placeholders = await getTitlesByMetadata({ public: false });
    LOG({ level: "INFO", message: `[Enrichment] Processing ${placeholders.length} placeholders...` });
    for (const ph of placeholders) {
        try {
            await updatePlaceholderMergeCandidates(ph._id);
        } catch (e) {
            LOG({
                level: "ERROR",
                message: `[Enrichment] Failed to process placeholder ${ph._id}`,
                context: { error: e },
            });
        }
        await new Promise((resolve) => setTimeout(resolve, 250)); // Rate limiting
    }

    const deletedCount = await deleteUnreferencedTitlePlaceholders();
    if (deletedCount > 0) {
        LOG({ level: "INFO", message: `[Enrichment] Cleaned up ${deletedCount} unreferenced placeholders` });
    }

    return {
        status: "success",
        message: "Enrichment task complete",
        stats: {
            refreshed: publicTitles.length,
            placeholdersProcessed: placeholders.length,
            placeholdersDeleted: deletedCount,
        },
    };
});
