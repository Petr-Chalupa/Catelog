export default defineEventHandler(async (event) => {
    const protectedPaths = ["invites", "titles", "users", "watchlists"];
    const isProtected = protectedPaths.some((path) => event.path.startsWith("/api/" + path));
    if (!isProtected) return;

    const session = await requireUserSession(event);

    if (!session) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    event.context.session = session.session;
    event.context.user = session.user;
});
