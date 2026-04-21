<template>
    <Header>
        <template #center>
            <span>
                Details - {{ item ? localeTitle(item.title.titles) : "Unknown item" }}
            </span>
        </template>
        <template #actions>
            <Icon name="lucide:merge" :size="25" @click="goToItemMerge" v-if="item && item.title.mergeCandidates.length > 0" />
            <Icon name="lucide:trash-2" :size="25" @click="handleDelete" v-online-only />
        </template>
    </Header>

    <LoadingState v-if="isLoadingLists || itemsQuery.isLoading.value" />

    <EmptyState v-else-if="!list || !item">This seems like an error</EmptyState>

    <main v-else>
        <section class="hero" :style="{ '--poster': 'url(' + item.title.poster + ')' }">
            <Image :src="item.title.poster" />
            <div class="content">
                <h1>{{ localeTitle(item.title.titles) }}</h1>
                <div class="quick-meta">
                    <span>{{ item.title.year ?? "?" }}</span>
                    <Icon name="lucide:dot" :size="23" />
                    <span>{{ item.title.durationMinutes ?? "?" }} min</span>
                    <span v-if="item.title.avgRating" class="rating">
                        <Icon name="ic:round-star" :size="23" /> {{ item.title.avgRating }}
                    </span>
                </div>
                <ItemWatchedStateButton :list-id="listId" :item="item" />
            </div>
        </section>

        <section class="rating">
            <RangeInput v-model="personalRating" :min="0" :max="10" :step="0.1" label="Rating" v-online-only />
        </section>

        <section class="genres">
            <h3>Genres</h3>
            <div class="body">
                <Triage v-model="genres" :items="ALL_GENRES" :states="['neutral', 'positive']" v-online-only>
                    <template #body="{ item }: { item: TitleGenre }">{{ resolveGenre(item) }}</template>
                </Triage>
            </div>
        </section>

        <section class="meta">
            <h3>Director{{ item.title.directors.length > 1 ? "s" : "" }}</h3>
            <p>{{ item.title.directors.join(", ") }}</p>

            <h3>Actor{{ item.title.actors.length > 1 ? "s" : "" }}</h3>
            <p>{{ item.title.actors.join(", ") }}</p>

            <h3>Added</h3>
            <p>{{ new Date(item.createdAt).toLocaleDateString() }}, {{ item.addedBy.name }}</p>
        </section>
    </main>
</template>

<style scoped src="~/assets/styles/item.css"></style>

<script setup lang="ts">
const route = useRoute();
const { localeTitle, resolveGenre } = useTitle();
const { confirm } = useConfirm();
const { lists, isLoadingLists, useItems, updateItem, deleteItem } = useWatchlists();

const listId = computed(() => route.params.listId as string);
const list = computed(() => lists.value?.find((l) => l._id === listId.value));

const itemId = computed(() => route.params.itemId as string);
const itemsQuery = useItems(listId);
const item = computed(() => itemsQuery.data.value?.find((i) => i._id === itemId.value));

const debouncedUpdate = useDebounce((body: WatchlistItemUpdate) => {
    updateItem({ listId: listId.value, itemId: itemId.value, body });
}, 300);

const personalRating = computed({
    get: () => item.value?.personalRating ?? 0,
    set: (val) => {
        if (!item.value) return;
        debouncedUpdate({ personalRating: val });
    }
});

const ALL_GENRES = TitleGenreSchema.options;
const genres = computed({
    get() {
        return ALL_GENRES.reduce((acc, genre) => {
            const isFromApi = item.value?.title?.genres?.includes(genre);
            const isExcluded = item.value?.excludedGenres?.includes(genre);
            const isAdded = item.value?.addedGenres?.includes(genre);
            acc[genre] = (isFromApi && !isExcluded) || isAdded ? "positive" : "neutral";
            return acc;
        }, {} as Record<TitleGenre, string>);
    },
    set(newStates) {
        if (!item.value) return;

        const added: TitleGenre[] = [];
        const excluded: TitleGenre[] = [];
        Object.entries(newStates).forEach(([genre, state]) => {
            const isFromApi = item.value?.title?.genres?.includes(genre as TitleGenre);
            if (state === "positive" && !isFromApi) added.push(genre as TitleGenre);
            if (state === "neutral") excluded.push(genre as TitleGenre);
        });

        debouncedUpdate({ addedGenres: added, excludedGenres: excluded });
    }
});

function goToItemMerge() {
    navigateTo(`/app/${listId.value}/${itemId.value}/merge`);
}

async function handleDelete() {
    const ok = await confirm("Delete Item", "This action is irreversible!");
    if (ok) {
        await deleteItem({ listId: listId.value, itemId: itemId.value });
        navigateTo(`/app/${listId.value}`);
    }
}
</script>