export default defineNuxtPlugin(async () => {
    const { user } = useUser();
    const { isSupported, permission, subscribeDevice } = usePush();

    watch(
        () => user.value?.notificationsEnabled,
        async (enabled) => {
            if (!enabled || !isSupported() || permission.value !== "granted") return;

            await subscribeDevice();
        },
        { immediate: true },
    );
});
