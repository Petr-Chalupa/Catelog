export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const listId = getRouterParam(event, "listId");
    if (!listId) throw createError({ statusCode: 400, statusMessage: "List ID is required" });

    const itemId = getRouterParam(event, "itemId");
    if (!itemId) throw createError({ statusCode: 400, statusMessage: "List item ID is required" });

    await deleteWatchlistItem(_id, listId, itemId);
});
