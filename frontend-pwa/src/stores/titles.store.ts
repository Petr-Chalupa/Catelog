import { defineStore } from "pinia";
import { TitlesService, type Title } from "../api";
import { ref } from "vue";

export const useTitlesStore = defineStore("titles", () => {
    // --- STATE ---
    const titles = ref<Record<string, Title>>({});
    const searchResults = ref<Title[]>([]);
    const isProcessing = ref(false);

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

    return { titles, searchResults, isProcessing, $reset, search, clearSearchResults, getTitleById };
});
