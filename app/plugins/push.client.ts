export default defineNuxtPlugin(async () => {
    const { user } = useUserStore();
    const { isSupported, permission, subscribeDevice } = usePush();

    watch(
        () => user?.notificationsEnabled,
        async (enabled) => {
            if (!enabled || !isSupported() || permission.value !== "granted") return;

            await subscribeDevice();
        },
        { immediate: true },
    );
});
