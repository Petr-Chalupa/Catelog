import { defineStore } from "pinia";
import { WatchListItem, WatchListsService, type WatchList } from "../api";

export const useWatchlistsStore = defineStore("watchlists", {
    state: () => ({
        lists: [] as WatchList[],
        listItems: {} as Record<string, WatchListItem[]>,
    }),
    getters: {
        sortedLists: (state) => {
            return [...state.lists].sort((a, b) => {
                const keyA = a.sortKey || "";
                const keyB = b.sortKey || "";
                return keyA.localeCompare(keyB);
            });
        },
    },
    actions: {
        async fetchLists() {
            this.lists = await WatchListsService.getWatchlists();
            // Fetch items in background
            for (const { id } of this.lists) {
                this.fetchListItems(id);
            }
        },
        async fetchListItems(listId: string) {
            const res = await WatchListsService.getWatchlistsItems(listId);
            this.listItems[listId] = res.items ?? [];
        },
        async updateListOrder(newOrderedLists: WatchList[], movedItem: WatchList) {
            const index = newOrderedLists.findIndex((l) => l.id === movedItem.id);
            const prevKey = newOrderedLists[index - 1]?.sortKey || "";
            const nextKey = newOrderedLists[index + 1]?.sortKey || "";
            const newKey = calculateMidpoint(prevKey, nextKey);

            const itemInStore = this.lists.find((l) => l.id === movedItem.id);
            if (itemInStore) itemInStore.sortKey = newKey;

            await WatchListsService.patchWatchlists(movedItem.id, { sortKey: newKey });
        },
    },
    persist: {
        key: "catelog-watchlists",
        storage: localStorage,
    },
});

function calculateMidpoint(prev: string, next: string): string {
    if (!prev) return next ? String.fromCharCode(next.charCodeAt(0) - 1) : "m";
    if (!next) return String.fromCharCode(prev.charCodeAt(prev.length - 1) + 1);
    return prev + "m";
}
