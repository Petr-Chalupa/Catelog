export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const data = await readValidatedBody(event, (data) => TitleImportSchema.parse(data));

    const title = await importTitle(data.externalIds, data.type);
    const titlePublic = await getTitleDetails(title._id);

    return titlePublic;
});
