export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const listId = getRouterParam(event, "listId");
    if (!listId) throw createError({ statusCode: 400, statusMessage: "List ID is required" });

    const watchlistItems = await getWatchlistItems(_id, listId);
    const watchlistItemsResults = await Promise.allSettled(watchlistItems.map((i) => getWatchlistItemDetails(i._id)));
    const watchlistItemsPublic = watchlistItemsResults
        .map((r) => {
            if (r.status === "fulfilled") return r.value;
            LOG({
                level: "WARN",
                error: r.reason,
                message: "Watchlist item hydration error",
                context: { path: event.path, status: r.reason.statusCode, user: _id },
            });
            return null;
        })
        .filter(Boolean);

    return watchlistItemsPublic;
});
