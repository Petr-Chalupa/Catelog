export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const deviceEndpoint = getRouterParam(event, "deviceEndpoint");
    if (!deviceEndpoint) throw createError({ statusCode: 400, statusMessage: "Device ID is required" });

    const data = await readValidatedBody(event, (data) => UserDeviceUpdateSchema.parse(data));
    const device = await updateUserDevice(_id, deviceEndpoint, data);
    const devicePublic = await getUserDeviceDetails(device._id);

    return devicePublic;
});
