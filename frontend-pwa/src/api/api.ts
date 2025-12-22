import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { OpenAPI } from "./core/OpenAPI";
import { AuthService } from "./services/AuthService";
import { router } from "../router";

export function initAPI() {
    const authStore = useAuthStore();
    OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL;
    OpenAPI.TOKEN = authStore.token;

    axios.interceptors.response.use(
        (res) => res,
        async (err) => {
            const originalRequest = err.config;

            if (err.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true; // Prevent infinite loops

                try {
                    const response = await AuthService.postUserAuthRefresh();
                    const token = response.accessToken;
                    authStore.setToken(token);
                    originalRequest.headers["Authorization"] = `Bearer ${token}`;
                    return axios.request(originalRequest);
                } catch (refreshError) {
                    authStore.clearToken();
                    router.push("/login");
                    return Promise.reject(refreshError);
                }
            }

            return Promise.reject(err);
        }
    );
}
