import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { type Invite, UserService, type User, InvitesService, type UserDevice } from "../api";
import { getDefaultLocale, i18n, type Language } from "../i18n";
import { useWatchlistsStore } from "./watchlists.store";
import { useAuthStore } from "./auth.store";
import { useNotificationStore } from "./notification.store";

const DEFAULT_PROFILE: User = { id: "", name: "", email: "", createdAt: "" };
const DEFAULT_THEME = "dark" as const;

export const useUserStore = defineStore(
    "user",
    () => {
        // --- STATE ---
        const profile = ref<User>({ ...DEFAULT_PROFILE });
        const invites = ref<Invite[]>([]);
        const theme = ref<"light" | "dark">(DEFAULT_THEME);
        const locale = ref<Language>(getDefaultLocale());
        const isProcessing = ref(false);
        const isInitialLoading = ref(true);

        // --- WATCHERS ---
        watch(theme, (newTheme) => (document.documentElement.dataset.theme = newTheme), { immediate: true });
        watch(
            locale,
            (newLocale) => {
                i18n.global.locale.value = newLocale;
                document.documentElement.lang = newLocale;
                if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: "SET_LOCALE", locale: newLocale });
                }
            },
            { immediate: true },
        );

        // --- RESET ---
        function $reset() {
            profile.value = { ...DEFAULT_PROFILE };
            theme.value = DEFAULT_THEME;
            locale.value = getDefaultLocale();
            isProcessing.value = false;
            isInitialLoading.value = true;
        }

        // --- FETCHING ---
        async function fetchProfile() {
            try {
                profile.value = await UserService.getUserMe();
                invites.value = await InvitesService.getInvites("incoming");
            } finally {
                isInitialLoading.value = false;
            }
        }

        // --- CORE ACTIONS ---
        async function updateProfile(data: Partial<User>) {
            isProcessing.value = true;
            try {
                profile.value = await UserService.patchUserMe(data);
            } finally {
                isProcessing.value = false;
            }
        }

        async function deleteAccount() {
            isProcessing.value = true;
            try {
                await UserService.deleteUserMe();
                return true;
            } finally {
                isProcessing.value = false;
            }
        }

        // --- INVITE HANDLING ---
        async function acceptInvite(inviteId: string) {
            isProcessing.value = true;
            try {
                await InvitesService.postInvitesAccept(inviteId);

                const authStore = useAuthStore();
                if (authStore.token) {
                    await fetchProfile();
                    await useWatchlistsStore().fetchLists();
                }
                return true;
            } catch (e) {
                return false;
            } finally {
                isProcessing.value = false;
            }
        }

        async function declineInvite(inviteId: string) {
            isProcessing.value = true;
            try {
                await InvitesService.deleteInvitesDecline(inviteId);
                invites.value = invites.value.filter((i) => i.id !== inviteId);
                return true;
            } catch (e) {
                return false;
            } finally {
                isProcessing.value = false;
            }
        }

        // --- NOTIFICATIONS ---
        async function toggleNotifications(enabled: boolean) {
            isProcessing.value = true;
            try {
                if (enabled) {
                    const permission = await Notification.requestPermission();
                    if (permission !== "granted") throw Error("Permission denied");

                    const registration = await getReadyServiceWorker();
                    let subscription = await registration.pushManager.getSubscription();
                    useNotificationStore().addNotification(`${subscription}`, "error");
                    if (!subscription) {
                        subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
                        });
                    }
                    const raw = subscription.toJSON();
                    const deviceData: UserDevice = {
                        deviceName: getDeviceName(),
                        endpoint: raw.endpoint!,
                        keys: { p256dh: raw.keys!.p256dh!, auth: raw.keys!.auth! },
                    };
                    useNotificationStore().addNotification(`${raw}`, "error");
                    useNotificationStore().addNotification(`${deviceData}`, "error");

                    await UserService.postUserDevicesSubscribe(deviceData);
                } else {
                    const registration = await getReadyServiceWorker();
                    const subscription = await registration.pushManager.getSubscription();
                    if (subscription) {
                        await UserService.postUserDevicesUnsubscribe({ endpoint: subscription.endpoint });
                        await subscription.unsubscribe();
                    }
                }

                await updateProfile({ notificationsEnabled: enabled });
            } finally {
                isProcessing.value = false;
            }
        }

        // --- THEME & LOCALE ---
        function toggleTheme() {
            theme.value = theme.value === "dark" ? "light" : "dark";
        }

        function setLocale(newLocale: Language) {
            locale.value = newLocale;
        }

        return {
            profile,
            invites,
            theme,
            locale,
            isProcessing,
            isInitialLoading,
            $reset,
            fetchProfile,
            updateProfile,
            deleteAccount,
            acceptInvite,
            declineInvite,
            toggleNotifications,
            toggleTheme,
            setLocale,
        };
    },
    {
        persist: {
            key: "catelog-user",
            storage: localStorage,
        },
    },
);

async function getReadyServiceWorker(timeout = 10000) {
    return Promise.race<ServiceWorkerRegistration>([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Service worker not ready")), timeout)),
    ]);
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function getDeviceName() {
    const ua = navigator.userAgent;
    if (ua.includes("iPhone")) return "iPhone";
    if (ua.includes("iPad")) return "iPad";
    if (ua.includes("Android")) return "Android Device";
    if (ua.includes("Windows")) return "Windows PC";
    if (ua.includes("Macintosh")) return "MacBook/iMac";
    return "Web Browser";
}
