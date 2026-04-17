export default defineEventHandler(async (event) => {
    const _id = event.context.user?.id;
    if (!_id) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const data = await readValidatedBody(event, (data) => UserDeviceCreateSchema.parse(data));
    if (_id !== data.userId) throw createError({ statusCode: 403, statusMessage: "This user can not do that" });

    const device = await createUserDevice(data);
    const devicePublic = await getUserDeviceDetails(device._id);

    return devicePublic;
});
