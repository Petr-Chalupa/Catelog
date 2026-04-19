<template>
    <Header>
        <template #center>
            <span>Filter - <ClientOnly fallback="Unknown list">{{ list?.name ?? "Unknown list" }}</ClientOnly></span>
        </template>
        <template #actions>
            <Icon name="lucide:delete" :size="25" @click="handleFiltersReset" />
        </template>
    </Header>

    <LoadingState v-if="isLoadingLists || itemsQuery.isLoading.value" />

    <EmptyState v-else-if="!list">This seems like an error</EmptyState>

    <main v-else>
        <section class="search">
            <Input v-model="filterBuffer.search" placeholder="Search by name..." />
        </section>

        <section class="states">
            <h3>States</h3>
            <div class="body">
                <Triage v-model="filterBuffer.states" :items="ALL_STATES">
                    <template #body="{ item }">{{ resolveState(item) }}</template>
                </Triage>
            </div>
        </section>

        <section class="types">
            <h3>Types</h3>
            <div class="body">
                <Triage v-model="filterBuffer.types" :items="ALL_TYPES">
                    <template #body="{ item }">{{ resolveType(item) }}</template>
                </Triage>
            </div>
        </section>

        <section class="ranges">
            <RangeInput v-model="filterBuffer.minRating" label="Min Rating" :min="RATING_BOUNDS.min" :max="RATING_BOUNDS.max" :step="0.1" />
            <RangeInput v-model="filterBuffer.maxDuration" label="Max Duration" unit="min" :min="DURATION_BOUNDS.min" :max="DURATION_BOUNDS.max" :step="10" />
            <RangeInput v-model="filterBuffer.minYear" label="From" unit="year" :min="YEAR_BOUNDS.min" :max="filterBuffer.maxYear ?? YEAR_BOUNDS.max" />
            <RangeInput v-model="filterBuffer.maxYear" label="To" unit="year" :min="filterBuffer.minYear ?? YEAR_BOUNDS.min" :max="YEAR_BOUNDS.max" />
        </section>

        <section class="genres">
            <h3>Genres</h3>
            <div class="body">
                <Triage v-model="filterBuffer.genres" :items="ALL_GENRES">
                    <template #body="{ item }">{{ resolveGenre(item) }}</template>
                </Triage>
            </div>
        </section>

        <section class="directors" v-if="ALL_DIRECTORS.length">
            <h3>Directors</h3>
            <div class="body">
                <Triage v-model="filterBuffer.directors" :items="ALL_DIRECTORS" />
            </div>
        </section>

        <section class="actors" v-if="ALL_ACTORS.length">
            <h3>Actors</h3>
            <div class="body">
                <Triage v-model="filterBuffer.actors" :items="ALL_ACTORS" />
            </div>
        </section>
    </main>
</template>

<style scoped src="~/assets/styles/filter.css"></style>

<script setup lang="ts">
const route = useRoute();
const { resolveGenre, resolveState, resolveType } = useTitle();
const { lists, isLoadingLists, useItems } = useWatchlists();
const { filters } = storeToRefs(useWatchlistFiltersStore());

const listId = computed(() => route.params.listId as string);
const list = computed(() => lists.value?.find((l) => l._id === listId.value));
const itemsQuery = useItems(listId);
const items = computed(() => itemsQuery.sorted.value);

const filterBuffer = ref<WatchlistFilters>({ ...filters.value });
const ALL_STATES = WatchStateSchema.options;
const ALL_TYPES = TitleTypeSchema.options;
const ALL_GENRES = TitleGenreSchema.options;
const ALL_DIRECTORS = computed(() => {
    const directors = items.value.flatMap((item) => item.title.directors);
    return [...new Set(directors)].sort();
});
const ALL_ACTORS = computed(() => {
    const actors = items.value.flatMap((item) => item.title.actors);
    return [...new Set(actors)].sort();
});
const YEAR_BOUNDS = computed(() => getBounds(i => i.title.year));
const DURATION_BOUNDS = computed(() => {
    const { min, max } = getBounds(i => i.title.durationMinutes);
    return { min: Math.floor(min / 10) * 10, max: Math.ceil(max / 10) * 10 };
});
const RATING_BOUNDS = computed(() => getBounds(i => i.title.avgRating));


const debouncedUpdate = useDebounce((newVal: WatchlistFilters) => {
    filters.value = { ...newVal };
}, 400);

watch(filterBuffer, (newVal) => debouncedUpdate(newVal), { deep: true });

function getBounds(path: (item: WatchlistItemPublic) => number | undefined | null) {
    const values = items.value.map(path).filter((v): v is number => v !== undefined && v !== null);
    if (values.length === 0) return { min: 0, max: 100 };
    return { min: Math.min(...values), max: Math.max(...values) };
}

function handleFiltersReset() {
    filterBuffer.value = {};
}
</script>