import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { i18n } from "../i18n";
import { useUserStore } from "../stores/user.store";
import { useNotificationStore } from "../stores/notification.store";
import { OpenAPI } from "../api/core/OpenAPI";

let offlineQueue: Array<() => void> = [];

let userStore: ReturnType<typeof useUserStore>;
let notificationStore: ReturnType<typeof useNotificationStore>;

export function initAPI() {
    userStore = useUserStore();
    notificationStore = useNotificationStore();

    axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
    axios.defaults.withCredentials = true;
    axios.defaults.timeout = 30000;

    OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL;
    OpenAPI.WITH_CREDENTIALS = true;
    OpenAPI.CREDENTIALS = "include";
}

window.addEventListener("online", () => {
    offlineQueue.forEach((resolve) => resolve());
    offlineQueue = [];
    notificationStore.addNotification(i18n.global.t("notifications.api-online"), "success");
});

axios.interceptors.request.use(async (config) => {
    if (!navigator.onLine) {
        await new Promise<void>((resolve) => offlineQueue.push(resolve));
    }

    return config;
});

axios.interceptors.response.use(
    (res) => res,
    async (err: AxiosError) => {
        if (err.response?.status === 401) {
            userStore.logout();
        } else if (err.response) {
            const message = (err.response?.data as any)?.message || i18n.global.t("notifications.api-generic-error");
            notificationStore.addNotification(message, "error");
        } else {
            notificationStore.addNotification(i18n.global.t("notifications.api-network-error"), "error");
        }

        return Promise.reject(err);
    },
);
