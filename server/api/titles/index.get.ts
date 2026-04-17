import z from "zod";

export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const { query } = await getValidatedQuery(event, (data) => z.object({ query: z.string() }).parse(data));

    const results = await searchTitles(query);
    return results;
});
