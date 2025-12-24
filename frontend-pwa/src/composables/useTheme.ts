import { computed, ref, watchEffect } from "vue";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

export function useTheme() {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) || (mediaQuery.matches ? "dark" : "light"));
    const isDark = computed(() => theme.value === "dark");

    watchEffect(() => {
        document.documentElement.dataset.theme = theme.value;
        localStorage.setItem(STORAGE_KEY, theme.value);
    });

    const toggle = () => {
        theme.value = theme.value === "dark" ? "light" : "dark";
    };

    return { theme, toggle, isDark };
}
