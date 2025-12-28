import { defineStore } from "pinia";
import {
    InvitesService,
    UserService,
    WatchListItem,
    WatchListsService,
    type Invite,
    type User,
    type WatchList,
} from "../api";
import { useUserStore } from "./user.store";
import { useNotificationStore } from "./notification.store";

export const useWatchlistsStore = defineStore("watchlists", {
    state: () => ({
        lists: [] as WatchList[],
        listItems: {} as Record<string, WatchListItem[]>,
        listMembers: {} as Record<string, User[]>,
        listInvites: {} as Record<string, Invite[]>,
        isProcessing: false,
        isInitialLoading: true,
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
        // --- FETCHING ---
        async fetchLists() {
            try {
                this.lists = await WatchListsService.getWatchlists();
                // Background fetching of list extra data
                for (const { id } of this.lists) {
                    this.fetchSingleList(id);
                }
            } finally {
                this.isInitialLoading = false;
            }
        },

        async fetchSingleList(id: string) {
            const list = await WatchListsService.getWatchlists1(id);
            const idx = this.lists.findIndex((l) => l.id === id);

            if (idx !== -1) this.lists[idx] = list;
            else this.lists.push(list);

            this.listMembers[id] = await Promise.all(list.sharedWith.map(async (m) => await UserService.getUser(m)));
            this.listItems[id] = (await WatchListsService.getWatchlistsItems(id)).items ?? [];
            this.listInvites[id] = await InvitesService.getInvitesWatchlists(id);
        },

        // --- CORE ACTIONS ---
        async patchWatchlist(id: string, data: Partial<WatchList>) {
            this.isProcessing = true;
            try {
                await WatchListsService.patchWatchlists(id, data);
                await this.fetchSingleList(id);
            } finally {
                this.isProcessing = false;
            }
        },

        async transferOwnership(listId: string, newOwnerId: string) {
            const notifications = useNotificationStore();
            this.isProcessing = true;
            try {
                await WatchListsService.postWatchlistsTransfer(listId, { newOwnerId });
                notifications.addNotification("Ownership transferred successfully", "success");
                await this.fetchSingleList(listId);
            } finally {
                this.isProcessing = false;
            }
        },

        async createWatchlist(name: string) {
            this.isProcessing = true;
            try {
                const newList = await WatchListsService.postWatchlists({ name });
                this.lists.push(newList);
                this.fetchSingleList(newList.id);
                return newList;
            } finally {
                this.isProcessing = false;
            }
        },

        async deleteWatchlist(id: string) {
            const notifications = useNotificationStore();
            this.isProcessing = true;
            try {
                await WatchListsService.deleteWatchlists(id);

                this.lists = this.lists.filter((l) => l.id !== id);
                delete this.listItems[id];
                delete this.listMembers[id];
                delete this.listInvites[id];

                notifications.addNotification("Watchlist deleted successfully", "success");
                return true;
            } catch (error) {
                return false;
            } finally {
                this.isProcessing = false;
            }
        },

        async updateListOrder(newOrderedLists: WatchList[], movedItem: WatchList) {
            const index = newOrderedLists.findIndex((l) => l.id === movedItem.id);
            const prevKey = newOrderedLists[index - 1]?.sortKey || "";
            const nextKey = newOrderedLists[index + 1]?.sortKey || "";
            const newKey = calculateMidpoint(prevKey, nextKey);

            if (newKey.length > 20) {
                return await rebalanceAllSortKeys(newOrderedLists);
            } else {
                const itemInStore = this.lists.find((l) => l.id === movedItem.id);
                if (itemInStore) itemInStore.sortKey = newKey;
                await WatchListsService.patchWatchlists(movedItem.id, { sortKey: newKey });
            }
        },

        // --- MEMBER & INVITE MANAGEMENT ---
        async sendInvite(listId: string, email: string) {
            const userStore = useUserStore();
            const notifications = useNotificationStore();

            if (email.toLowerCase() === userStore.profile.email.toLowerCase()) {
                notifications.addNotification("You cannot invite yourself", "error");
                return;
            }
            const existingMembers = this.listMembers[listId] || [];
            if (existingMembers.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
                notifications.addNotification("User is already a member", "error");
                return;
            }
            const invitedMembers = this.listInvites[listId] || [];
            if (invitedMembers.some((i) => i.inviteeEmail?.toLowerCase() === email.toLowerCase())) {
                notifications.addNotification("User is already invited", "error");
                return;
            }

            this.isProcessing = true;
            try {
                const invitee = await UserService.getUser(undefined, email);

                await InvitesService.postInvites({ listId, invitee: invitee.id });
                notifications.addNotification(`Invite sent to ${email}`, "success");

                await this.fetchSingleList(listId);
            } finally {
                this.isProcessing = false;
            }
        },

        async revokeInvite(inviteId: string, listId: string) {
            this.isProcessing = true;
            try {
                await InvitesService.deleteInvitesDecline(inviteId);
                await this.fetchSingleList(listId);
            } finally {
                this.isProcessing = false;
            }
        },

        async removeMember(listId: string, userId: string) {
            const list = this.lists.find((l) => l.id === listId);
            if (!list) return;

            this.isProcessing = true;
            try {
                const newMembers = list.sharedWith.filter((id) => id !== userId);
                await WatchListsService.patchWatchlists(listId, { sharedWith: newMembers });
                await this.fetchSingleList(listId);
            } finally {
                this.isProcessing = false;
            }
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

async function rebalanceAllSortKeys(array: (WatchList | WatchListItem)[], listId?: string) {
    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        if (!item) continue;

        const freshKey = i.toString().padStart(5, "0");
        item.sortKey = freshKey;

        if (listId) {
            await WatchListsService.patchWatchlistsItems(listId, item.id, { sortKey: freshKey });
        } else {
            await WatchListsService.patchWatchlists(item.id, { sortKey: freshKey });
        }
    }
}
