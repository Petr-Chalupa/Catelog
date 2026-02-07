import { defineStore } from "pinia";
import { TitleGenre, TitlesService, TitleType, type Title } from "../api";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

export const useTitlesStore = defineStore("titles", () => {
    const { te, t, locale } = useI18n();

    // --- STATE ---
    const titles = ref<Record<string, Title>>({});
    const searchResults = ref<Title[]>([]);
    const isProcessing = ref(false);

    // --- GETTERS ---
    const translateTitle = computed(() => (title?: Partial<Title>): string => {
        if (!title || !title.titles) return "?";
        return title.titles[locale.value] || title.titles["en"] || Object.values(title.titles)[0] || "?";
    });

    const translateType = computed(() => (type?: TitleType): string => {
        if (!type) return "?";
        const key = `types.${type}`;
        return te(key) ? t(key) : type;
    });

    const translateGenre = computed(() => (genre?: TitleGenre): string => {
        if (!genre) return "?";
        const key = `genres.${genre}`;
        return te(key) ? t(key) : genre;
    });

    // --- RESET ---
    function $reset() {
        titles.value = {};
        searchResults.value = [];
        isProcessing.value = false;
    }

    // --- ACTIONS ---
    async function search(query: string) {
        if (!query.trim()) {
            searchResults.value = [];
            return;
        }

        isProcessing.value = true;
        try {
            const results = await TitlesService.getTitlesSearch(query);
            searchResults.value = results;
            results.forEach((t) => (titles.value[t.id] = t));
        } finally {
            isProcessing.value = false;
        }
    }

    function clearSearchResults() {
        searchResults.value = [];
    }

    async function getTitleById(id: string) {
        const title = await TitlesService.getTitles(id);
        titles.value[id] = title;
        return title;
    }

    async function importTitle(externalIds: Record<string, string>, type: TitleType) {
        externalIds = Object.fromEntries(Object.entries(externalIds).filter(([_, value]) => !!value));
        const title = await TitlesService.postTitlesImport({ externalIds, type });
        return title;
    }

    return {
        translateTitle,
        translateType,
        translateGenre,
        titles,
        searchResults,
        isProcessing,
        $reset,
        search,
        clearSearchResults,
        getTitleById,
        importTitle,
    };
});
