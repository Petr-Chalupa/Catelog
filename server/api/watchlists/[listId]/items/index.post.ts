export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const listId = getRouterParam(event, "listId");
    if (!listId) throw createError({ statusCode: 400, statusMessage: "List ID is required" });

    const data = await readValidatedBody(event, (data) => WatchlistItemCreateSchema.parse(data));
    const watchlistItem = await createWatchlistItem(_id, data);
    const watchlistItemPublic = await getWatchlistItemDetails(watchlistItem._id);

    return watchlistItemPublic;
});
