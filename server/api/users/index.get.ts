export default defineEventHandler(async (event) => {
    const data = await getValidatedQuery(event, (data) => UserQuerySchema.parse(data));

    const user = await getUserBy(data);
    if (!user) throw createError({ statusCode: 404, statusMessage: "User not found" });

    const userPublic = await getUserDetails(user._id, true);

    return userPublic;
});
