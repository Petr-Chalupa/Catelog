import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { User } from "../api";
import { i18n } from "../i18n";

export const useUserStore = defineStore(
    "user",
    () => {
        // --- STATE ---
        const profile = ref<User>({ id: "", name: "", email: "", createdAt: "" });
        const theme = ref<"light" | "dark">("dark");
        const locale = ref<string>(navigator.language.split("-")[0] || "en");

        // --- WATCHERS ---
        watch(theme, (newTheme) => (document.documentElement.dataset.theme = newTheme), { immediate: true });
        watch(
            locale,
            (newLocale) => {
                i18n.global.locale.value = newLocale;
                document.documentElement.lang = newLocale;
            },
            { immediate: true }
        );

        // --- ACTIONS ---
        function setProfile(user: User) {
            profile.value = user;
        }

        function toggleTheme() {
            theme.value = theme.value === "dark" ? "light" : "dark";
        }

        function setLocale(newLocale: string) {
            locale.value = newLocale;
        }

        return { profile, theme, locale, setProfile, toggleTheme, setLocale };
    },
    {
        persist: {
            key: "catelog-user",
            storage: localStorage,
        },
    }
);
