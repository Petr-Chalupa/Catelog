export default function () {
    const { $api } = useNuxtApp();
    const { user } = useUser();
    const toasts = useToasts();

    const isSupported = () =>
        import.meta.client
            ? "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
            : false;

    const permission = ref(isSupported() ? Notification.permission : "default");

    const needsPermission = computed(
        () => user.value?.notificationsEnabled && isSupported() && permission.value !== "granted",
    );

    const requestPermission = async () => {
        if (!isSupported()) return false;
        const result = await Notification.requestPermission();
        permission.value = result;
    };

    const subscribeDevice = async () => {
        if (!user.value) {
            toasts.warn("User not loaded. Cannot subscribe device.");
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) return;

        const newSub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: useRuntimeConfig().public.VAPID_PUBLIC_KEY,
        });
        const subJSON = newSub.toJSON();
        const newDevice: UserDeviceCreate = {
            userId: user.value._id,
            deviceName: navigator.userAgent,
            endpoint: newSub.endpoint,
            keys: { p256dh: subJSON.keys!.p256dh!, auth: subJSON.keys!.auth! },
        };

        await $api("/api/users/devices", { method: "POST", body: newDevice });
    };

    const enableNotifications = async () => {
        if (!user.value) {
            toasts.warn("User not loaded. Cannot enable notifications.");
            return;
        }

        await $api("/api/users/me", { method: "PATCH", body: { notificationsEnabled: true } as UserUpdate });
        user.value.notificationsEnabled = true;

        if (permission.value === "granted") await subscribeDevice();
    };

    const disableNotifications = async () => {
        if (!user.value) {
            toasts.warn("User not loaded. Cannot disable notifications.");
            return;
        }

        await $api("/api/users/me", { method: "PATCH", body: { notificationsEnabled: false } as UserUpdate });
        user.value.notificationsEnabled = false;

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
            await $api(`/api/users/devices/${subscription.endpoint}`, { method: "DELETE" });
        }
    };

    return {
        isSupported,
        permission,
        needsPermission,
        requestPermission,
        subscribeDevice,
        enableNotifications,
        disableNotifications,
    };
}
