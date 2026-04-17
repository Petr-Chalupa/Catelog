export default defineEventHandler((event) => {
    const protectedPaths = ["system"];
    const isProtected = protectedPaths.some((path) => event.path.startsWith("/api/" + path));
    if (!isProtected) return;

    const authHeader = getHeader(event, "X-System-Key");

    if (!authHeader || authHeader !== useRuntimeConfig().SYSTEM_MAINTENANCE_KEY) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
});
