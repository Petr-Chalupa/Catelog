import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { User } from "../api";
import { getDefaultLocale, i18n, type Language } from "../i18n";

const DEFAULT_PROFILE: User = { id: "", name: "", email: "", createdAt: "" };
const DEFAULT_THEME = "dark" as const;

export const useUserStore = defineStore(
    "user",
    () => {
        // --- STATE ---
        const profile = ref<User>({ ...DEFAULT_PROFILE });
        const theme = ref<"light" | "dark">(DEFAULT_THEME);
        const locale = ref<Language>(getDefaultLocale());

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
        function $reset() {
            profile.value = { ...DEFAULT_PROFILE };
            theme.value = DEFAULT_THEME;
            locale.value = getDefaultLocale();
        }

        function setProfile(user: User) {
            profile.value = user;
        }

        function toggleTheme() {
            theme.value = theme.value === "dark" ? "light" : "dark";
        }

        function setLocale(newLocale: Language) {
            locale.value = newLocale;
        }

        return { profile, theme, locale, $reset, setProfile, toggleTheme, setLocale };
    },
    {
        persist: {
            key: "catelog-user",
            storage: localStorage,
        },
    }
);
