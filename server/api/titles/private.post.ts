export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    console.log(_id);

    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const data = await readValidatedBody(event, (data) => TitleCreatePlaceholderSchema.parse(data));

    const title = await createTitlePlaceholder(data);
    const titlePublic = await getTitleDetails(title._id);

    return titlePublic;
});
