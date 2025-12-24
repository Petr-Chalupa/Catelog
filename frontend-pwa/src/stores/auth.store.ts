import { defineStore } from "pinia";
import { OpenAPI } from "../api";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        token: "",
    }),
    actions: {
        setToken(newToken: string) {
            this.token = newToken;
            OpenAPI.TOKEN = newToken;
        },
        clearToken() {
            this.token = "";
            OpenAPI.TOKEN = "";
        },
    },
    persist: {
        key: "catelog-auth",
        storage: localStorage,
    },
});
