import { defineStore } from "pinia";
import { TitlesService, TitleType, type Title } from "../api";
import { computed, ref } from "vue";
import { i18n } from "../i18n";

export const useTitlesStore = defineStore("titles", () => {
    // --- STATE ---
    const titles = ref<Record<string, Title>>({});
    const searchResults = ref<Title[]>([]);
    const isProcessing = ref(false);

    // --- GETTERS ---
    const displayTitle = computed(() => (title?: Partial<Title>): string => {
        if (!title || !title.titles) return "?";
        const locale = i18n.global.locale.value;
        return title.titles[locale] || title.titles["en"] || Object.values(title.titles)[0] || "?";
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
        displayTitle,
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
