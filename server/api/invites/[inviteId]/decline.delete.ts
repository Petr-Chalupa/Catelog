export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const inviteId = getRouterParam(event, "inviteId");
    if (!inviteId) throw createError({ statusCode: 400, statusMessage: "Invite ID is required" });

    const invite = await getInviteById(inviteId);
    if (!invite) throw createError({ statusCode: 404, statusMessage: "Invite not found" });

    await declineInvite(invite?.token, _id);

    return { message: "Invite decline" };
});
