export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const deviceEndpoint = getRouterParam(event, "deviceEndpoint");
    if (!deviceEndpoint) throw createError({ statusCode: 400, statusMessage: "Device endpoint is required" });

    await deleteUserDevice(_id, deviceEndpoint);
});
