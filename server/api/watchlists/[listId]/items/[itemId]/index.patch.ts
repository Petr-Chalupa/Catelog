export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const listId = getRouterParam(event, "listId");
    if (!listId) throw createError({ statusCode: 400, statusMessage: "List ID is required" });

    const itemId = getRouterParam(event, "itemId");
    if (!itemId) throw createError({ statusCode: 400, statusMessage: "List item ID is required" });

    const data = await readValidatedBody(event, (data) => WatchlistItemUpdateSchema.parse(data));
    const watchlistItem = await updateWatchlistItem(_id, listId, itemId, data);
    const watchlistItemPublic = await getWatchlistItemDetails(watchlistItem._id);

    return watchlistItemPublic;
});
