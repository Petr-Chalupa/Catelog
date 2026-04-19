<template>
    <Header>
        <template #center>
            <span>Search - <ClientOnly fallback="Unknown list">{{ list?.name ?? "Unknown list" }}</ClientOnly></span>
        </template>
    </Header>

    <LoadingState v-if="isLoadingLists || itemsQuery.isLoading.value" />

    <EmptyState v-else-if="!list">This seems like an error</EmptyState>

    <main v-else>
        <section class="search">
            <Input placeholder="Search title" v-model="inputModel" :actions="[]" v-online-only />
        </section>

        <LoadingState v-if="searchPending" />

        <EmptyState v-else-if="searchResults.length === 0">Try searching something</EmptyState>

        <section class="results" v-else>
            <List :items="searchResults" keyPath="poster">
                <template #body="{ item }: { item: TitleCreate }">
                    <Image :src="item.poster" />
                    <div class="info">
                        <span class="title">{{ localeTitle(item.titles) }}</span>
                        <span class="other">{{ item.year ?? "?" }} | {{ item.type }}</span>
                        <span class="genres">
                            <span v-for="genre in resolveGenres(item.genres, [], []).slice(0, 3)" :key="genre" class="genre-tag">
                                {{ genre }}
                            </span>
                        </span>
                    </div>
                </template>
                <template #actions="{ item }: { item: TitleCreate }">
                    <Icon name="lucide:check" v-if="isAlreadyInList(item)" class="check" :size="30" />
                    <Icon name="lucide:plus" v-else :size="30" @click="handleAddToList(item)" :disabled="isCreatingItem" v-online-only />
                </template>
            </List>
        </section>
    </main>
</template>

<style scoped src="~/assets/styles/search.css"></style>

<script setup lang="ts">
const { $api } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const { localeTitle, resolveGenres } = useTitle();
const { lists, isLoadingLists, useItems, createItem, isCreatingItem } = useWatchlists();

const listId = computed(() => route.params.listId as string);
const list = computed(() => lists.value?.find((l) => l._id === listId.value));
const itemsQuery = useItems(listId);
const currentItems = computed(() => itemsQuery.sorted.value);

const query = computed(() => (route.query.q as string) ?? "");
const inputModel = computed({
    get: () => query.value,
    set: (val: string) => {
        debouncedUpdate(val);
    }
});

const isAlreadyInList = (res: TitleCreate) => {
    return currentItems.value.some(item => {
        return Object.entries(res.externalIds).some(([source, id]) =>
            item.title?.externalIds?.[source as TitleSource] === id
        );
    });
};

const debouncedUpdate = useDebounce((val: string) => {
    router.replace({
        query: {
            ...route.query,
            q: val.trim(),
        },
    });
}, 400);

watch(inputModel, (newVal) => debouncedUpdate(newVal));

const { data: searchResults, pending: searchPending } = useLazyAsyncData(
    `search-${query.value}`,
    () => {
        if (query.value.length < 3) return Promise.resolve([]);
        return $api<TitleCreate[]>("/api/titles", { query: { query: query.value } });
    },
    {
        watch: [query],
        default: () => []
    }
);

async function handleAddToList(title: TitleCreate) {
    if (isAlreadyInList(title)) return;

    const titleImport: TitleImport = {
        externalIds: title.externalIds,
        type: title.type
    };
    await createItem({ listId: listId.value, title: titleImport });
}
</script>