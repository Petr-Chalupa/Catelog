export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const watchlists = await getUserWatchlists(_id);
    const watchlistsResults = await Promise.allSettled(watchlists.map((w) => getWatchlistDetails(w._id, _id)));
    const watchlistsPublic = watchlistsResults
        .map((r) => {
            if (r.status === "fulfilled") return r.value;
            LOG({
                level: "WARN",
                error: r.reason,
                message: "Watchlist hydration error",
                context: { path: event.path, status: r.reason.statusCode, user: _id },
            });
            return null;
        })
        .filter(Boolean);

    return watchlistsPublic;
});
