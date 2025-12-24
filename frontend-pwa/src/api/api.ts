import axios from "axios";
import { useAuthStore } from "../stores/auth.store";
import { OpenAPI } from "./core/OpenAPI";
import { AuthService } from "./services/AuthService";

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token?: string) => {
    failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
    failedQueue = [];
};

export function initAPI() {
    const authStore = useAuthStore();
    OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL;
    OpenAPI.TOKEN = authStore.token;
    OpenAPI.WITH_CREDENTIALS = true;

    axios.defaults.baseURL = OpenAPI.BASE;
    axios.defaults.withCredentials = true;

    axios.interceptors.response.use(
        (res) => res,
        async (err) => {
            const originalRequest = err.config;

            if (originalRequest._retry || !err.response || err.response.status !== 401) {
                return Promise.reject(err);
            }

            if (originalRequest.url?.includes("/user/auth/refresh")) {
                authStore.logout();
                return Promise.reject(err);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers["Authorization"] = `Bearer ${token}`;
                        return axios.request(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            } else {
                isRefreshing = true;
                originalRequest._retry = true;

                return new Promise((resolve, reject) => {
                    AuthService.postUserAuthRefresh()
                        .then((response) => {
                            const token = response.accessToken;
                            authStore.setToken(token);
                            processQueue(null, token);
                            originalRequest.headers["Authorization"] = `Bearer ${token}`;
                            resolve(axios.request(originalRequest));
                        })
                        .catch((refreshError) => {
                            authStore.logout();
                            processQueue(refreshError);
                            reject(refreshError);
                        })
                        .finally(() => {
                            isRefreshing = false;
                        });
                });
            }
        }
    );
}
