import { defineStore } from "pinia";
import { ref } from "vue";
import { router } from "../router";
import { AuthService, OpenAPI } from "../api";
import { useConfirmStore } from "./confirm.store";
import { useUserStore } from "./user.store";
import { useWatchlistsStore } from "./watchlists.store";
import { useNotificationStore } from "./notification.store";
import { useTitlesStore } from "./titles.store";

export const useAuthStore = defineStore(
    "auth",
    () => {
        // --- STATE ---
        const token = ref("");
        const isProcessing = ref(false);

        // --- RESET ---
        function $reset() {
            token.value = "";
            isProcessing.value = false;
        }

        // --- ACTIONS ---
        function setToken(newToken: string) {
            token.value = newToken;
            OpenAPI.TOKEN = newToken;
        }

        function clearToken() {
            token.value = "";
            OpenAPI.TOKEN = "";
        }

        async function logout() {
            isProcessing.value = true;
            try {
                await AuthService.postUserAuthLogout();

                clearToken();

                useNotificationStore().$reset();
                useConfirmStore().$reset();
                useTitlesStore().$reset();
                useUserStore().$reset();
                useWatchlistsStore().$reset();

                router.push("/login");
            } finally {
                isProcessing.value = false;
            }
        }

        return {
            token,
            isProcessing,
            $reset,
            setToken,
            clearToken,
            logout,
        };
    },
    {
        persist: {
            key: "catelog-auth",
            storage: localStorage,
        },
    },
);
