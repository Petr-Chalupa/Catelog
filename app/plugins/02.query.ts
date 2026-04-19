import { VueQueryPlugin, QueryClient, hydrate, dehydrate } from "@tanstack/vue-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

const userKeys = {
    all: ["user"] as const,
    me: () => [...userKeys.all, "me"] as const,
};

const invitesKeys = {
    all: ["invites"] as const,
    incoming: () => [...invitesKeys.all, "incoming"] as const,
};

const watchlistsKeys = {
    all: ["watchlists"] as const,
    detail: (listId: string) => [...watchlistsKeys.all, listId] as const,
    items: (listId: string) => [...watchlistsKeys.all, "items", listId] as const,
    item: (listId: string, itemId: string) => [...watchlistsKeys.items(listId), itemId] as const,
};

export default defineNuxtPlugin((nuxtApp) => {
    const vueQueryState = useState("vue-query");

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60, // 1 minute
                gcTime: 1000 * 60 * 60 * 24, // 24 hours
                retry: 1,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                throwOnError: false,
                networkMode: "always",
            },
            mutations: {
                retry: 0,
            },
        },
    });

    nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });

    if (import.meta.server) {
        nuxtApp.hooks.hook("app:rendered", () => {
            vueQueryState.value = dehydrate(queryClient);
        });
    }

    if (import.meta.client) {
        nuxtApp.hooks.hook("app:created", () => {
            hydrate(queryClient, vueQueryState.value);
        });

        nuxtApp.hooks.hook("app:mounted", () => {
            persistQueryClient({
                queryClient,
                persister: createAsyncStoragePersister({ storage: window.localStorage }),
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) => query.state.status === "success",
                },
            });
        });
    }

    return {
        provide: {
            queryKeys: {
                userKeys,
                invitesKeys,
                watchlistsKeys,
            },
        },
    };
});
