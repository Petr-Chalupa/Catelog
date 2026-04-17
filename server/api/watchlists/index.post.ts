export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const data = await readValidatedBody(event, (data) => WatchlistCreateSchema.parse(data));
    if (data.ownerId !== _id) {
        throw createError({ statusCode: 403, statusMessage: "Forbidden: You cannot create watchlist as someone else" });
    }

    const watchlist = await createWatchList(data);
    const watchlistPublic = await getWatchlistDetails(watchlist._id, _id);

    return watchlistPublic;
});
