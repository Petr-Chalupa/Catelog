import { defineStore } from "pinia";
import { OpenAPI } from "../api";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        token: localStorage.getItem("token") || "",
    }),
    actions: {
        setToken(newToken: string) {
            this.token = newToken;
            localStorage.setItem("token", newToken);
            OpenAPI.TOKEN = newToken;
        },
        clearToken() {
            this.token = "";
            localStorage.removeItem("token");
            OpenAPI.TOKEN = "";
        },
    },
});
