export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const listId = getRouterParam(event, "listId");
    if (!listId) throw createError({ statusCode: 400, statusMessage: "List ID is required" });

    const data = await readValidatedBody(event, (data) => WatchlistUpdateSchema.parse(data));
    const watchlist = await updateWatchlist(_id, listId, data);
    const watchlistPublic = await getWatchlistDetails(watchlist._id, _id);

    return watchlistPublic;
});
