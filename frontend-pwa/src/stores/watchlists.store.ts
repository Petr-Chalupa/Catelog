import { defineStore } from "pinia";
import {
    InvitesService,
    Title,
    TitlesService,
    UserService,
    WatchListItem,
    WatchListsService,
    type Invite,
    type User,
    type WatchList,
} from "../api";
import { useUserStore } from "./user.store";
import { useNotificationStore } from "./notification.store";
import { computed, ref } from "vue";
import { useTitlesStore } from "./titles.store";
import { i18n } from "../i18n";

export interface EnrichedWatchListItem extends WatchListItem {
    details?: Title;
    displayTitle: string;
    resolvedGenres: string[];
}

export const useWatchlistsStore = defineStore(
    "watchlists",
    () => {
        const notify = useNotificationStore();
        const titlesStore = useTitlesStore();

        // --- STATE ---
        const lists = ref<WatchList[]>([]);
        const listItems = ref<Record<string, WatchListItem[]>>({});
        const listMembers = ref<Record<string, User[]>>({});
        const listInvites = ref<Record<string, Invite[]>>({});
        const isProcessing = ref(false);
        const isInitialLoading = ref(true);

        // --- GETTERS ---
        const sortedLists = computed((): WatchList[] => {
            return [...lists.value].sort((a, b) => {
                const keyA = a.sortKey || "";
                const keyB = b.sortKey || "";
                return keyA.localeCompare(keyB);
            });
        });

        const enrichedListItems = computed(() => (listId: string): EnrichedWatchListItem[] => {
            const rawItems = listItems.value[listId] ?? [];
            return rawItems.map((item) => enrichItem(item, titlesStore.titles, i18n.global.locale.value));
        });

        const enrichedListItem = computed(() => (listId: string, itemId: string): EnrichedWatchListItem | undefined => {
            const item = listItems.value[listId]?.find((i) => i.id === itemId);
            if (!item) return undefined;
            return enrichItem(item, titlesStore.titles, i18n.global.locale.value);
        });

        const availableListFilters = computed(() => (listId: string) => {
            const items = enrichedListItems.value(listId);
            const genres = new Set<string>();
            let minDuration = Infinity;
            let maxDuration = 0;
            let minYear = Infinity;
            let maxYear = 0;
            let minRating = Infinity;
            let maxRating = 0;
            const directorsMap = new Map<string, number>();
            const actorsMap = new Map<string, number>();

            items.forEach((i) => {
                i.resolvedGenres.forEach((g) => genres.add(g));

                const duration = i.details?.durationMinutes;
                if (duration) {
                    if (duration < minDuration) minDuration = duration;
                    if (duration > maxDuration) maxDuration = duration;
                }

                const year = i.details?.year;
                if (year) {
                    if (year < minYear) minYear = year;
                    if (year > maxYear) maxYear = year;
                }

                const rating = i.details?.avgRating;
                if (rating) {
                    if (rating < minRating) minRating = rating;
                    if (rating > maxRating) maxRating = rating;
                }

                i.details?.directors?.forEach((d) => directorsMap.set(d, (directorsMap.get(d) || 0) + 1));
                i.details?.actors?.forEach((a) => actorsMap.set(a, (actorsMap.get(a) || 0) + 1));
            });

            const getTop = (map: Map<string, number>, limit = 10) =>
                Array.from(map.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, limit)
                    .map((e) => e[0])
                    .sort();

            return {
                genres: Array.from(genres).sort(),
                durationRange: {
                    min: minDuration === Infinity ? 0 : minDuration,
                    max: maxDuration,
                },
                yearRange: {
                    min: minYear === Infinity ? 1800 : minYear,
                    max: maxYear === 0 ? new Date().getFullYear() : maxYear,
                },
                ratingRange: {
                    min: minRating === Infinity ? 0 : minRating,
                    max: maxRating,
                },
                directors: getTop(directorsMap),
                actors: getTop(actorsMap),
            };
        });

        // --- RESET ---
        function $reset() {
            lists.value = [];
            listItems.value = {};
            listMembers.value = {};
            listInvites.value = {};
            isProcessing.value = false;
            isInitialLoading.value = true;
        }

        // --- ACTIONS ---
        async function fetchLists() {
            try {
                lists.value = await WatchListsService.getWatchlists();
                // Background fetching of list extra data
                for (const { id } of lists.value) {
                    fetchSingleList(id);
                }
            } finally {
                isInitialLoading.value = false;
            }
        }

        async function fetchSingleList(id: string) {
            const list = await WatchListsService.getWatchlists1(id);
            const idx = lists.value.findIndex((l) => l.id === id);

            if (idx !== -1) lists.value[idx] = list;
            else lists.value.push(list);

            listMembers.value[id] = await Promise.all(list.sharedWith.map(async (m) => await UserService.getUser(m)));
            listItems.value[id] = (await WatchListsService.getWatchlistsItems(id)).items ?? [];
            listInvites.value[id] = await InvitesService.getInvitesWatchlists(id);

            listItems.value[id].forEach((i) => titlesStore.getTitleById(i.titleId));
        }

        async function createList(name: string) {
            isProcessing.value = true;
            try {
                const newList = await WatchListsService.postWatchlists({ name });
                lists.value.push(newList);
                await fetchSingleList(newList.id);
                return newList;
            } finally {
                isProcessing.value = false;
            }
        }

        async function deleteList(id: string) {
            isProcessing.value = true;
            try {
                await WatchListsService.deleteWatchlists(id);
                lists.value = lists.value.filter((l) => l.id !== id);

                delete listItems.value[id];
                delete listInvites.value[id];
                delete listMembers.value[id];

                return true;
            } catch (error) {
                return false;
            } finally {
                isProcessing.value = false;
            }
        }

        async function patchWatchlist(id: string, data: Partial<WatchList>) {
            isProcessing.value = true;
            try {
                await WatchListsService.patchWatchlists(id, data);
                await fetchSingleList(id);
            } finally {
                isProcessing.value = false;
            }
        }

        async function transferOwnership(listId: string, newOwnerId: string) {
            isProcessing.value = true;
            try {
                await WatchListsService.postWatchlistsTransfer(listId, { newOwnerId });
                notify.addNotification("Ownership transferred successfully", "success");
                await fetchSingleList(listId);
            } finally {
                isProcessing.value = false;
            }
        }

        async function updateListOrder(newOrderedLists: WatchList[], movedItem: WatchList) {
            const index = newOrderedLists.findIndex((l) => l.id === movedItem.id);
            const prevKey = newOrderedLists[index - 1]?.sortKey || "";
            const nextKey = newOrderedLists[index + 1]?.sortKey || "";
            const newKey = calculateMidpoint(prevKey, nextKey);

            if (newKey.length > 20) {
                return await rebalanceAllSortKeys(newOrderedLists);
            } else {
                const itemInStore = lists.value.find((l) => l.id === movedItem.id);
                if (itemInStore) itemInStore.sortKey = newKey;
                await WatchListsService.patchWatchlists(movedItem.id, { sortKey: newKey });
            }
        }

        // --- MEMBER & INVITE MANAGEMENT ---
        async function sendInvite(listId: string, email: string) {
            const userStore = useUserStore();

            if (email.toLowerCase() === userStore.profile.email.toLowerCase()) {
                notify.addNotification("You cannot invite yourself", "error");
                return;
            }
            const existingMembers = listMembers.value[listId] || [];
            if (existingMembers.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
                notify.addNotification("User is already a member", "error");
                return;
            }
            const invitedMembers = listInvites.value[listId] || [];
            if (invitedMembers.some((i) => i.inviteeEmail?.toLowerCase() === email.toLowerCase())) {
                notify.addNotification("User is already invited", "error");
                return;
            }

            isProcessing.value = true;
            try {
                const invitee = await UserService.getUser(undefined, email);

                await InvitesService.postInvites({ listId, invitee: invitee.id });
                notify.addNotification(`Invite sent to ${email}`, "success");

                await fetchSingleList(listId);
            } finally {
                isProcessing.value = false;
            }
        }

        async function revokeInvite(inviteId: string, listId: string) {
            isProcessing.value = true;
            try {
                await InvitesService.deleteInvitesDecline(inviteId);
                await fetchSingleList(listId);
            } finally {
                isProcessing.value = false;
            }
        }

        async function removeMember(listId: string, userId: string) {
            const list = lists.value.find((l) => l.id === listId);
            if (!list) return;

            isProcessing.value = true;
            try {
                const newMembers = list.sharedWith.filter((id) => id !== userId);
                await WatchListsService.patchWatchlists(listId, { sharedWith: newMembers });
                await fetchSingleList(listId);
            } finally {
                isProcessing.value = false;
            }
        }

        // --- ITEMS ---
        async function addItemToList(listId: string, payload: { title?: Title; name?: string }) {
            isProcessing.value = true;
            try {
                const titleRequest = payload.title || { title: payload.name };
                const savedTitle = await TitlesService.postTitles(titleRequest as Title);
                const titleId = savedTitle.id;

                const titlesStore = useTitlesStore();
                titlesStore.titles[titleId] = savedTitle;

                const existingItems = listItems.value[listId] ?? [];
                if (existingItems.some((item) => item.titleId === titleId)) {
                    notify.addNotification("This title is already in the list", "error");
                    return;
                }

                const newItem = await WatchListsService.postWatchlistsItems(listId, { titleId });
                if (!listItems.value[listId]) listItems.value[listId] = [];
                listItems.value[listId].push(newItem);
            } catch (error) {
                throw error;
            } finally {
                isProcessing.value = false;
            }
        }

        async function deleteWatchlistItem(listId: string, itemId: string) {
            isProcessing.value = true;
            try {
                await WatchListsService.deleteWatchlistsItems(listId, itemId);
                if (listItems.value[listId]) {
                    listItems.value[listId] = listItems.value[listId].filter((i) => i.id !== itemId);
                }

                return true;
            } catch (error) {
                return false;
            } finally {
                isProcessing.value = false;
            }
        }

        async function patchWatchlistItem(listId: string, itemId: string, data: Partial<WatchListItem>) {
            isProcessing.value = true;
            try {
                await WatchListsService.patchWatchlistsItems(listId, itemId, data);
                await fetchSingleList(listId);
            } finally {
                isProcessing.value = false;
            }
        }

        async function updateListItemOrder(listId: string, newOrderedItems: WatchListItem[], movedItem: WatchListItem) {
            const index = newOrderedItems.findIndex((i) => i.id === movedItem.id);
            const prevKey = newOrderedItems[index - 1]?.sortKey || "";
            const nextKey = newOrderedItems[index + 1]?.sortKey || "";
            const newKey = calculateMidpoint(prevKey, nextKey);

            if (newKey.length > 20) {
                await rebalanceAllSortKeys(newOrderedItems, listId);
            } else {
                const itemInStore = listItems.value[listId]?.find((i) => i.id === movedItem.id);
                if (itemInStore) itemInStore.sortKey = newKey;
                await WatchListsService.patchWatchlistsItems(listId, movedItem.id, { sortKey: newKey });
            }
        }

        return {
            lists,
            listItems,
            listMembers,
            listInvites,
            isProcessing,
            isInitialLoading,
            sortedLists,
            enrichedListItems,
            enrichedListItem,
            availableListFilters,
            $reset,
            fetchLists,
            fetchSingleList,
            createList,
            deleteList,
            patchWatchlist,
            transferOwnership,
            updateListOrder,
            sendInvite,
            revokeInvite,
            removeMember,
            addItemToList,
            deleteWatchlistItem,
            patchWatchlistItem,
            updateListItemOrder,
        };
    },
    {
        persist: {
            key: "catelog-watchlists",
            storage: localStorage,
        },
    },
);

function enrichItem(item: WatchListItem, titles: Record<string, Title>, locale: string): EnrichedWatchListItem {
    const titleMetadata = titles[item.titleId];
    const displayTitle = titleMetadata?.localizedTitles?.[locale] || titleMetadata?.title || "?";

    const titleGenres = titleMetadata?.genres ?? [];
    const added = item.addedGenres ?? [];
    const excluded = item.excludedGenres ?? [];
    const finalGenres = [...new Set([...titleGenres, ...added])].filter((g) => !excluded.includes(g));

    return {
        ...item,
        details: titleMetadata,
        displayTitle,
        resolvedGenres: finalGenres,
    };
}

function calculateMidpoint(prev: string, next: string): string {
    if (!prev) return next ? String.fromCharCode(next.charCodeAt(0) - 1) : "m";
    if (!next) return prev + "m";

    let i = 0;
    while (prev[i] === next[i] && i < prev.length) i++;

    const charP = prev.charCodeAt(i) || 96; // 96 is before 'a'
    const charN = next.charCodeAt(i) || 123; // 123 is after 'z'
    if (charN - charP > 1) {
        return prev.slice(0, i) + String.fromCharCode(Math.floor((charP + charN) / 2));
    }

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
