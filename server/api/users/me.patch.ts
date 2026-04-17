export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const data = await readValidatedBody(event, (data) => UserUpdateSchema.parse(data));
    const user = await updateUser(_id, data);
    const userPublic = await getUserDetails(user._id, false);

    return userPublic;
});
