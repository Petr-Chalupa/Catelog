import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { i18n } from "../i18n";
import { useAuthStore } from "../stores/auth.store";
import { useNotificationStore } from "../stores/notification.store";
import { OpenAPI } from "./core/OpenAPI";
import { AuthService } from "./services/AuthService";

let isRefreshing = false;
let failedQueue: any[] = [];
let offlineQueue: Array<() => void> = [];

let authStore: ReturnType<typeof useAuthStore>;
let notificationStore: ReturnType<typeof useNotificationStore>;

export function initAPI() {
    authStore = useAuthStore();
    notificationStore = useNotificationStore();

    axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
    axios.defaults.withCredentials = true;
    axios.defaults.timeout = 30000;

    OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL;
    OpenAPI.WITH_CREDENTIALS = true;
    OpenAPI.TOKEN = authStore.token;
}

const processQueue = (error: any, token?: string) => {
    failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
    failedQueue = [];
};

window.addEventListener("online", () => {
    offlineQueue.forEach((resolve) => resolve());
    offlineQueue = [];
    notificationStore.addNotification(i18n.global.t("notifications.api-online"), "success");
});

axios.interceptors.request.use(async (config) => {
    if (!navigator.onLine) {
        await new Promise<void>((resolve) => offlineQueue.push(resolve));
    }

    if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
    }

    return config;
});

axios.interceptors.response.use(
    (res) => res,
    async (err: AxiosError) => {
        const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (err.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url?.includes("/user/auth/refresh")) {
                authStore.logout();
                return Promise.reject(err);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axios.request(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await AuthService.postUserAuthRefresh();
                authStore.setToken(response.accessToken);
                processQueue(null, response.accessToken);
                return axios.request(originalRequest);
            } catch (refreshError) {
                authStore.logout();
                processQueue(refreshError);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (err.response) {
            const message = (err.response?.data as any)?.message || i18n.global.t("notifications.api-generic-error");
            notificationStore.addNotification(message, "error");
        } else {
            notificationStore.addNotification(i18n.global.t("notifications.api-network-error"), "error");
        }

        return Promise.reject(err);
    },
);
