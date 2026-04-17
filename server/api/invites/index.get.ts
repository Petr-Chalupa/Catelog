import z from "zod";

export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const { type } = await getValidatedQuery(event, (data) => z.object({ type: InviteTypeSchema }).parse(data));

    const invites = await getUserInvites(_id, type);
    const invitesResults = await Promise.allSettled(invites.map((i) => getInviteDetails(i._id)));
    const invitesPublic = invitesResults
        .map((r) => {
            if (r.status === "fulfilled") return r.value;
            LOG({
                level: "WARN",
                error: r.reason,
                message: "Invite hydration error",
                context: { path: event.path, status: r.reason.statusCode, user: _id },
            });
            return null;
        })
        .filter(Boolean);

    return invitesPublic;
});
