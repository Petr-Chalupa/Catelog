import { defineStore } from "pinia";
import { AuthService, OpenAPI } from "../api";
import { router } from "../router";
import { useUserStore } from "./user.store";
import { useWatchlistsStore } from "./watchlists.store";

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
        async logout() {
            await AuthService.postUserAuthLogout();
            this.clearToken();

            const userStore = useUserStore();
            userStore.$reset();
            const watchlistsStore = useWatchlistsStore();
            watchlistsStore.$reset();

            router.push("/login");
        },
    },
    persist: {
        key: "catelog-auth",
        storage: localStorage,
    },
});
