import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { generateKeyBetween } from "fractional-indexing";

export default function () {
    const { $api, $queryKeys } = useNuxtApp();
    const { watchlistsKeys } = $queryKeys;
    const queryClient = useQueryClient();
    const { user } = useUserSession();
    const toasts = useToasts();

    // --- QUERY LISTS ---
    const listsQuery = useQuery({
        queryKey: watchlistsKeys.all,
        queryFn: () => $api<WatchlistPublic[]>("/api/watchlists"),
    });

    // --- QUERY ITEMS ---
    const useItems = (listId: MaybeRef<string>) => {
        const query = useQuery({
            queryKey: computed(() => watchlistsKeys.items(unref(listId))),
            queryFn: ({ signal }) => $api<WatchlistItemPublic[]>(`/api/watchlists/${unref(listId)}/items`, { signal }),
            enabled: computed(() => !!unref(listId)),
        });

        const sorted = computed(() => {
            if (!query.data.value) return [];
            return [...query.data.value].sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1));
        });

        return {
            ...query,
            sorted,
        };
    };

    // --- SORTED LISTS ---
    const getSortedLists = computed(() => {
        if (!listsQuery.data.value) return [];
        else return [...listsQuery.data.value].sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1));
    });

    // --- CREATE LIST ---
    const createList = useMutation({
        mutationFn: async (name: string) => {
            const sorted = getSortedLists.value;
            const last = sorted.at(-1);
            const sortKey = generateKeyBetween(last?.sortKey, undefined);

            return $api<WatchlistPublic>("/api/watchlists", {
                method: "POST",
                body: { ownerId: user.value?.id, name, sortKey } as WatchlistCreate,
            });
        },

        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: watchlistsKeys.all, exact: true });
        },

        onSuccess: (newList) => {
            queryClient.setQueryData(watchlistsKeys.all, (old: WatchlistPublic[] = []) => [...old, newList]);
        },

        onError: (e) => {
            toasts.error("Failed to create watchlist", e);
        },
    });

    // --- UPDATE LIST ---
    const updateList = useMutation({
        mutationFn: ({ listId, body }: { listId: string; body: WatchlistUpdate }) =>
            $api(`/api/watchlists/${listId}`, { method: "PATCH", body }),

        onMutate: async ({ listId, body }) => {
            await queryClient.cancelQueries({ queryKey: watchlistsKeys.all, exact: true });

            const previous = queryClient.getQueryData<WatchlistPublic[]>(watchlistsKeys.all);

            queryClient.setQueryData(watchlistsKeys.all, (old: WatchlistPublic[] = []) =>
                old.map((l) => (l._id === listId ? { ...l, ...body } : l)),
            );

            return { previous };
        },

        onError: (_err, _variables, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(watchlistsKeys.all, ctx.previous);
            }
            toasts.error("Failed to update watchlist", _err);
        },
    });

    // --- DELETE LIST ---
    const deleteList = useMutation({
        mutationFn: (listId: string) => $api(`/api/watchlists/${listId}`, { method: "DELETE" }),

        onMutate: async (listId) => {
            await queryClient.cancelQueries({ queryKey: watchlistsKeys.all, exact: true });

            const previous = queryClient.getQueryData<WatchlistPublic[]>(watchlistsKeys.all);

            queryClient.setQueryData(watchlistsKeys.all, (old: WatchlistPublic[] = []) =>
                old.filter((l) => l._id !== listId),
            );

            return { previous };
        },

        onSuccess: (_data, listId) => {
            queryClient.removeQueries({ queryKey: watchlistsKeys.items(listId) });
        },

        onError: (_err, _listId, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(watchlistsKeys.all, ctx.previous);
            }
            toasts.error("Failed to delete watchlist", _err);
        },
    });

    // --- REORDER LISTS ---
    const reorderLists = async (moved: WatchlistPublic, newIndex: number) => {
        const sorted = getSortedLists.value;
        const others = sorted.filter((l) => l._id !== moved._id);
        const prev = others[newIndex - 1];
        const next = others[newIndex];
        const sortKey = generateKeyBetween(prev?.sortKey, next?.sortKey);

        await updateList.mutateAsync({ listId: moved._id, body: { sortKey } });
    };

    // --- CREATE ITEM ---
    const createItem = useMutation({
        mutationFn: async ({ listId, title }: { listId: string; title: TitleImport }) => {
            const itemsQuery = useItems(listId);
            const sorted = itemsQuery.sorted.value;
            const last = sorted.at(-1);
            const sortKey = generateKeyBetween(last?.sortKey, undefined);

            const { _id } = await $api<TitlePublic>("/api/titles/public", { method: "POST", body: title });

            return $api<WatchlistItemPublic>(`/api/watchlists/${listId}/items`, {
                method: "POST",
                body: {
                    listId,
                    titleId: _id,
                    addedById: user.value?.id,
                    sortKey,
                } as WatchlistItemCreate,
            });
        },

        onMutate: async ({ listId }) => {
            await queryClient.cancelQueries({ queryKey: watchlistsKeys.items(listId), exact: true });
        },

        onSuccess: (newItem, { listId }) => {
            queryClient.setQueryData(watchlistsKeys.items(listId), (old: WatchlistItemPublic[] = []) => [
                ...old,
                newItem,
            ]);
        },

        onError: (_err) => {
            toasts.error("Failed to create item", _err);
        },
    });

    // --- CREATE ITEM PRIVATE ---
    const createItemPrivate = useMutation({
        mutationFn: async ({ listId, title }: { listId: string; title: string }) => {
            const itemsQuery = useItems(listId);
            const sorted = itemsQuery.sorted.value;
            const last = sorted.at(-1);
            const sortKey = generateKeyBetween(last?.sortKey, undefined);
            const locale = useState<string>("locale");

            const { _id } = await $api<TitlePublic>("/api/titles/private", {
                method: "POST",
                body: { titles: { [locale.value]: title }, type: "other" } as TitleCreatePlaceholder,
            });

            return $api<WatchlistItemPublic>(`/api/watchlists/${listId}/items`, {
                method: "POST",
                body: {
                    listId,
                    titleId: _id,
                    addedById: user.value?.id,
                    sortKey,
                } as WatchlistItemCreate,
            });
        },

        onMutate: async ({ listId }) => {
            await queryClient.cancelQueries({ queryKey: watchlistsKeys.items(listId), exact: true });
        },

        onSuccess: (newItem, { listId }) => {
            queryClient.setQueryData(watchlistsKeys.items(listId), (old: WatchlistItemPublic[] = []) => [
                ...old,
                newItem,
            ]);
        },

        onError: (_err) => {
            toasts.error("Failed to create private item", _err);
        },
    });

    // --- UPDATE ITEM ---
    const updateItem = useMutation({
        mutationFn: ({ listId, itemId, body }: { listId: string; itemId: string; body: WatchlistItemUpdate }) =>
            $api(`/api/watchlists/${listId}/items/${itemId}`, { method: "PATCH", body }),

        onMutate: async ({ listId, itemId, body }) => {
            const key = watchlistsKeys.items(listId);

            await queryClient.cancelQueries({ queryKey: key, exact: true });

            const previous = queryClient.getQueryData<WatchlistItemPublic[]>(key);
            queryClient.setQueryData(key, (old: WatchlistItemPublic[] = []) =>
                old.map((i) => (i._id === itemId ? { ...i, ...body } : i)),
            );

            return { previous };
        },

        onError: (_err, { listId }, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(watchlistsKeys.items(listId), ctx.previous);
            }
            toasts.error("Failed to update watchlist item", _err);
        },
    });

    // --- MERGE ITEM ---
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

            if (titleId) await updateItem.mutateAsync({ listId, itemId, body: { titleId } });
        } catch (_err) {
            toasts.error("Failed to merge watchlist item", _err);
        }
    };

    // --- DELETE ITEM ---
    const deleteItem = useMutation({
        mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
            $api(`/api/watchlists/${listId}/items/${itemId}`, { method: "DELETE" }),

        onMutate: async ({ listId, itemId }) => {
            const key = watchlistsKeys.items(listId);

            await queryClient.cancelQueries({ queryKey: key, exact: true });

            const previous = queryClient.getQueryData<WatchlistItemPublic[]>(key);
            queryClient.setQueryData(key, (old: WatchlistItemPublic[] = []) => old.filter((i) => i._id !== itemId));

            return { previous };
        },

        onError: (_err, { listId }, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(watchlistsKeys.items(listId), ctx.previous);
            }
            toasts.error("Failed to delete item", _err);
        },
    });

    // --- REORDER ITEMS ---
    const reorderItems = async (listId: string, moved: WatchlistItemPublic, newIndex: number) => {
        const itemsQuery = useItems(listId);
        const sorted = itemsQuery.sorted.value;
        const others = sorted.filter((i) => i._id !== moved._id);
        const prev = others[newIndex - 1];
        const next = others[newIndex];
        const sortKey = generateKeyBetween(prev?.sortKey, next?.sortKey);

        await updateItem.mutateAsync({ listId, itemId: moved._id, body: { sortKey } });
    };

    return {
        lists: listsQuery.data,
        isLoadingLists: listsQuery.isLoading,
        isErrorLists: listsQuery.isError,
        errorLists: listsQuery.error,
        getSortedLists,
        refetchLists: listsQuery.refetch,

        useItems,

        createList: createList.mutateAsync,
        isCreatingList: createList.isPending,

        updateList: updateList.mutateAsync,
        isUpdatingList: updateList.isPending,

        deleteList: deleteList.mutateAsync,
        isDeletingList: deleteList.isPending,

        reorderLists,

        createItem: createItem.mutateAsync,
        isCreatingItem: createItem.isPending,

        createItemPrivate: createItemPrivate.mutateAsync,
        isCreatingItemPrivate: createItemPrivate.isPending,

        updateItem: updateItem.mutateAsync,
        isUpdatingItem: updateItem.isPending,

        mergeItem,

        deleteItem: deleteItem.mutateAsync,
        isDeletingItem: deleteItem.isPending,

        reorderItems,
    };
}
