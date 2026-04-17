export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const data = await readValidatedBody(event, (data) => InviteCreateSchema.parse(data));
    if (data.inviterId !== _id) {
        throw createError({ statusCode: 403, statusMessage: "Forbidden: You cannot invite as someone else" });
    }

    const invite = await createInvite(data);
    const invitePublic = await getInviteDetails(invite._id);

    return invitePublic;
});
