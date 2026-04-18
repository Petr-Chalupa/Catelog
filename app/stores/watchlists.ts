import { generateKeyBetween } from "fractional-indexing";
import z from "zod";

export const useWatchlistsStore = defineStore(
    "watchlists",
    () => {
        const { $api } = useNuxtApp();
        const { user } = useUserSession();
        const toasts = useToasts();

        // --- STATE ---
        const lists = ref<WatchlistPublic[]>([]);
        const items = ref<Record<string, WatchlistItemPublic[]>>({});
        const itemFilters = ref<WatchlistFilters>({});
        const isReadyLists = ref(false);
        const isReadyItems = ref<Record<string, boolean>>({});

        // --- GETTERS ---
        const getSortedLists = computed(() => {
            return [...lists.value].sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1));
        });

        const passesTriage = (filterMap: Record<string, string> | undefined, itemValues: string[]) => {
            if (!filterMap) return true;
            return Object.entries(filterMap).every(([val, state]) => {
                if (state === "positive") return itemValues.includes(val);
                if (state === "negative") return !itemValues.includes(val);
                return true; // Neutral
            });
        };

        const getFilteredItems = computed(() => (listId: string) => {
            const allItems = items.value[listId] || [];
            const f = itemFilters.value;

            return allItems.filter((item) => {
                if (
                    f.search &&
                    !Object.values(item.title.titles).some((t) => t.toLowerCase().includes(f.search!.toLowerCase()))
                ) {
                    return false;
                }
                if (f.maxDuration && (item.title.durationMinutes ?? 0) > f.maxDuration) return false;
                if (f.minRating && (item.personalRating ?? item.title.avgRating ?? 0) < f.minRating) return false;
                if (f.minYear && (item.title.year ?? 0) < f.minYear) return false;
                if (f.maxYear && (item.title.year ?? 9999) > f.maxYear) return false;

                const effectiveGenres = [...item.title.genres, ...item.addedGenres].filter(
                    (g) => !item.excludedGenres.includes(g),
                );

                return (
                    passesTriage(f.states, [item.state]) &&
                    passesTriage(f.types, [item.title.type]) &&
                    passesTriage(f.genres, effectiveGenres) &&
                    passesTriage(f.directors, item.title.directors) &&
                    passesTriage(f.actors, item.title.actors)
                );
            });
        });

        const getSortedItems = computed(() => (listId: string) => {
            const listItems = getFilteredItems.value(listId);
            return [...listItems].sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1));
        });

        const getList = computed(() => (listId: string) => {
            return lists.value.find((l) => l._id === listId);
        });

        const getItem = computed(() => (listId: string, itemId: string) => {
            return items.value[listId]?.find((i) => i._id === itemId);
        });

        // --- ACTIONS: LISTS ---
        const fetch = async () => {
            try {
                lists.value = await $api<WatchlistPublic[]>("/api/watchlists");
            } catch (e) {
                toasts.error("Failed to fetch watchlists", e);
            } finally {
                isReadyLists.value = true;
            }
        };

        const createList = async (name: string) => {
            if (!name.trim()) return;

            const lastList = getSortedLists.value.at(-1);
            const sortKey = generateKeyBetween(lastList?.sortKey, undefined);

            try {
                const newList = await $api<WatchlistPublic>("/api/watchlists", {
                    method: "POST",
                    body: { ownerId: user.value?.id, name, sortKey } as WatchlistUpdate,
                });
                lists.value.push(newList);
            } catch (e) {
                toasts.error("Failed to create watchlist", e);
            }
        };

        const updateList = async (listId: string, body: WatchlistUpdate) => {
            const index = lists.value.findIndex((l) => l._id === listId);
            if (index === -1) return;

            const originalList = { ...lists.value[index]! };
            Object.assign(lists.value[index]!, body);

            try {
                await $api(`/api/watchlists/${listId}`, { method: "PATCH", body });
            } catch (e) {
                lists.value[index] = originalList;
                toasts.error("Failed to update watchlist", e);
            }
        };

        const deleteList = async (listId: string) => {
            const index = lists.value.findIndex((l) => l._id === listId);
            if (index === -1) return;

            const originalList = lists.value[index]!;
            const originalItems = items.value[listId];
            lists.value.splice(index, 1);
            delete items.value[listId];

            try {
                await $api(`/api/watchlists/${listId}`, { method: "DELETE" });
            } catch (e) {
                lists.value.splice(index, 0, originalList);
                if (originalItems) {
                    items.value[listId] = originalItems;
                }
                toasts.error("Failed to delete watchlist", e);
            }
        };

        const reorderLists = async (moved: WatchlistPublic, newIndex: number) => {
            const others = getSortedLists.value.filter((l) => l._id !== moved._id);
            const prev = others[newIndex - 1];
            const next = others[newIndex];

            const newSortKey = generateKeyBetween(prev?.sortKey, next?.sortKey);
            await updateList(moved._id, { sortKey: newSortKey });
        };

        // --- ACTIONS: ITEMS ---
        const fetchItems = async (listId: string) => {
            try {
                const data = await $api<WatchlistItemPublic[]>(`/api/watchlists/${listId}/items`, { method: "GET" });
                items.value[listId] = data;
            } catch (e) {
                toasts.error("Failed to fetch watchlist items", e);
            } finally {
                isReadyItems.value[listId] = true;
            }
        };

        const createItem = async (listId: string, title: TitleImport) => {
            const listItems = items.value[listId];
            if (!listItems) return;

            const lastItem = listItems.at(-1);
            const sortKey = generateKeyBetween(lastItem?.sortKey, undefined);

            try {
                const { _id } = await $api<TitlePublic>("/api/titles/public", { method: "POST", body: title });
                const newItem = await $api<WatchlistItemPublic>(`/api/watchlists/${listId}/items`, {
                    method: "POST",
                    body: { listId, titleId: _id, addedById: user.value?.id, sortKey } as WatchlistItemCreate,
                });
                listItems.push(newItem);
            } catch (e) {
                toasts.error("Failed to create item", e);
            }
        };

        const createItemPrivate = async (listId: string, name: string) => {
            const listItems = items.value[listId];
            if (!listItems) return;
            if (!name.trim()) return;

            const locale = useState<string>("locale");
            const lastItem = listItems.at(-1);
            const sortKey = generateKeyBetween(lastItem?.sortKey, undefined);

            try {
                const { _id } = await $api<TitlePublic>("/api/titles/private", {
                    method: "POST",
                    body: { titles: { [locale.value]: name }, type: "other" } as TitleCreatePlaceholder,
                });
                const newItem = await $api<WatchlistItemPublic>(`/api/watchlists/${listId}/items`, {
                    method: "POST",
                    body: { listId, titleId: _id, addedById: user.value?.id, sortKey } as WatchlistItemCreate,
                });
                listItems.push(newItem);
            } catch (e) {
                toasts.error("Failed to create private item", e);
            }
        };

        const updateItem = async (listId: string, itemId: string, body: WatchlistItemUpdate) => {
            const listItems = items.value[listId];
            if (!listItems) return;

            const index = listItems.findIndex((i) => i._id === itemId);
            if (index === -1) return;

            const originalItem = { ...listItems[index]! };
            Object.assign(listItems[index]!, body);

            try {
                await $api(`/api/watchlists/${listId}/items/${itemId}`, { method: "PATCH", body });
            } catch (e) {
                listItems[index] = originalItem;
                toasts.error("Failed to update watchlist item", e);
            }
        };

        const mergeItem = async (listId: string, itemId: string, candidate: MergeCandidate) => {
            try {
                let titleId = candidate.internalId;

                if (!titleId && candidate.externalIds) {
                    const { _id } = await $api<TitlePublic>("/api/titles/public", {
                        method: "POST",
                        body: {
                            externalIds: candidate.externalIds,
                            type: candidate.displayData.type,
                        } as TitleImport,
                    });
                    titleId = _id;
                }

                if (titleId) await updateItem(listId, itemId, { titleId });
            } catch (e) {
                toasts.error("Failed to merge watchlist item", e);
            }
        };

        const deleteItem = async (listId: string, itemId: string) => {
            const listItems = items.value[listId];
            if (!listItems) return;

            const index = listItems.findIndex((i) => i._id === itemId);
            if (index === -1) return;

            const originalItem = listItems[index]!;
            listItems.splice(index, 1);

            try {
                await $api(`/api/watchlists/${listId}/items/${itemId}`, { method: "DELETE" });
            } catch (e) {
                listItems.splice(index, 0, originalItem);
                toasts.error("Failed to delete watchlist item", e);
            }
        };

        const reorderItems = async (listId: string, moved: WatchlistItemPublic, newIndex: number) => {
            const others = getSortedItems.value(listId).filter((i) => i._id !== moved._id);
            const prev = others[newIndex - 1];
            const next = others[newIndex];

            const newSortKey = generateKeyBetween(prev?.sortKey, next?.sortKey);
            await updateItem(listId, moved._id, { sortKey: newSortKey });
        };

        const clear = () => {
            lists.value = [];
            items.value = {};
            isReadyLists.value = false;
            isReadyItems.value = {};
        };

        return {
            lists,
            items,
            itemFilters,
            isReadyLists,
            isReadyItems,
            getSortedLists,
            getFilteredItems,
            getSortedItems,
            getList,
            getItem,
            fetch,
            createList,
            updateList,
            deleteList,
            reorderLists,
            fetchItems,
            createItem,
            createItemPrivate,
            updateItem,
            mergeItem,
            deleteItem,
            reorderItems,
            clear,
        };
    },
    {
        persist: {
            pick: ["lists", "items", "itemFilters"],
            serializer: {
                serialize: (value) => JSON.stringify(value),
                deserialize: (value) => {
                    const parsed = JSON.parse(value);
                    const listsResult = z.array(WatchlistPublicSchema).safeParse(parsed.lists);
                    const itemsResult = z
                        .record(z.string(), z.array(WatchlistItemPublicSchema))
                        .safeParse(parsed.items);
                    return {
                        lists: listsResult.success ? listsResult.data : [],
                        items: itemsResult.success ? itemsResult.data : {},
                        itemFilters: parsed.itemFilters ?? {},
                    };
                },
            },
        },
    },
);
