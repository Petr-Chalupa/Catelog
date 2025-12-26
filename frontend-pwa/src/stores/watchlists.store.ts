import { defineStore } from "pinia";
import { WatchListsService, type WatchList } from "../api";

export const useWatchlistsStore = defineStore("watchlists", {
    state: () => ({
        lists: [] as WatchList[],
    }),
    actions: {
        async fetchLists() {
            this.lists = await WatchListsService.getWatchlists();
        },
    },
    persist: {
        key: "catelog-watchlists",
        storage: localStorage,
    },
});
