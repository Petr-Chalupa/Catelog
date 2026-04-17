export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const inviteId = getRouterParam(event, "inviteId");
    if (!inviteId) throw createError({ statusCode: 400, statusMessage: "Invite ID is required" });

    const invitePublic = await getInviteDetails(inviteId);
    if (invitePublic.inviter._id !== _id || invitePublic.invitee._id !== _id) {
        throw createError({ statusCode: 403, statusMessage: "Forbidden: You cannot view this invite" });
    }

    return invitePublic;
});
