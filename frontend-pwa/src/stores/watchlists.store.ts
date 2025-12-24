import { defineStore } from "pinia";

export const useAuthStore = defineStore("watchlists", {
    state: () => ({}),
    actions: {},
    persist: {
        key: "catelog-watchlists",
        storage: localStorage,
    },
});
