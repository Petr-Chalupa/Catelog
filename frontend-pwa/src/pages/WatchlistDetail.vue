<template>
    <Header>
        <template #center>
            <span>{{ list?.name }}</span>
        </template>
        <template #actions>
            <Search @click="openFilter" />
            <Settings @click="openSettings" />
        </template>
    </Header>

    <main>
        <section v-if="watchlistsStore.isInitialLoading" class="loading-state">
            <LoaderIcon :size="48" class="animate-spin" />
            <p>Loading items...</p>
        </section>

        <section v-else-if="activeItems.length == 0" class="empty-state">
            <Library :size="48" />
            <p>No items found. Create one to get started!</p>
        </section>

        <DraggableList v-else :items="activeItems" @row-click="goToItem($event.id)" @item-moved="({ element, newArray }) => watchlistsStore.updateListItemOrder(listId, newArray, element)">
            <template #body="{ item }">
                <div class="item">
                    <img v-if="item.details?.poster" :src="item.details.poster" class="poster" />
                    <Image v-else class="poster" />
                    <div class="info">
                        <div class="info">
                            <span class="title">{{ item.details?.title }}</span>
                            <span class="other">{{ item.details?.year ?? "-" }} | {{ item.details?.type }}</span>
                            <span class="genres">
                                <span v-for="genre in item.details?.genres?.slice(0, 3)" :key="genre" class="genre-tag">
                                    {{ genre }}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </template>
            <template #actions="{ item }">
                <input type="radio" class="watched-btn" @click.stop="handleItemState(item)" />
            </template>
        </DraggableList>

        <details v-if="finishedItems.length > 0" class="finished-section">
            <summary class="finished-summary">
                <ChevronRight class="arrow-icon" :size="20" />
                <span class="finished-title">Dokončeno ({{ finishedItems.length }})</span>
            </summary>
            <div class="finished-list">
                <div v-for="item in finishedItems" :key="item.id" class="item finished-item" @click="goToItem(item.id)">
                    <img v-if="item.details?.poster" :src="item.details.poster" class="poster" />
                    <Image v-else class="poster" />
                    <div class="info">
                        <span class="title">{{ item.details?.title }}</span>
                        <span class="other">{{ item.details?.year ?? "-" }} | {{ item.details?.type }}</span>
                        <span class="genres">
                            <span v-for="genre in item.details?.genres?.slice(0, 3)" :key="genre" class="genre-tag">
                                {{ genre }}
                            </span>
                        </span>
                    </div>
                    <input type="radio" checked class="watched-btn" @click.stop="handleItemState(item)" />
                </div>
            </div>
        </details>

        <button v-if="!isSearchExpanded" class="add-item-btn" @click="openSearch">
            <Plus :size="28" />
        </button>

        <Overlay v-model="isFilterExpanded" history-key="filter">
            <template #header>
                <Input v-model="filterQuery" placeholder="Filtrovat list..." autoFocus>
                    <template #actions>
                        <button class="close-btn" @click="closeFilter">
                            <X :size="20" />
                        </button>
                    </template>
                </Input>
            </template>
            <template #body>
                <div class="filter-body">
                    <div class="filter-content">
                        <div class="filter-section">
                            <label class="section-label">Max délka [min]:</label>
                            <input type="range" :min="availableFilters.durationRange.min" :max="availableFilters.durationRange.max" v-model.number="maxDurationFilter" class="duration-slider" />
                            <div class="range-labels">
                                <span>{{ availableFilters.durationRange.min }}</span>
                                <span>{{ Math.round((availableFilters.durationRange.min + availableFilters.durationRange.max) / 2) }}</span>
                                <span>{{ availableFilters.durationRange.max }}</span>
                            </div>
                        </div>
                        <div class="filter-section">
                            <label class="section-label">Žánry:</label>
                            <Triage :items="availableFilters.genres" v-model="genreFilters" class="genre-triage-item">
                                <template #icon="{ state }">
                                    <span v-if="state === 'positive'" class="icon">✓</span>
                                    <span v-if="state === 'negative'" class="icon">✕</span>
                                </template>
                            </Triage>
                        </div>
                        <div class="filter-section">
                            <label class="section-label">Režiséři:</label>
                        </div>
                        <div class="filter-section">
                            <label class="section-label">Herci:</label>
                        </div>
                    </div>

                    <button class="reset-filters-btn" @click="resetFilters">Resetovat filtry</button>
                </div>
            </template>
        </Overlay>

        <Overlay v-model="isSearchExpanded" history-key="search">
            <template #header>
                <Input v-model="searchQuery" placeholder="Hledat film..." @enter="handleSearch" autoFocus>
                    <template #actions>
                        <button class="search-btn" @click="handleSearch" :disabled="titlesStore.isProcessing">
                            <Search v-if="!titlesStore.isProcessing" :size="20" />
                            <LoaderIcon v-else :size="20" class="animate-spin" />
                        </button>
                        <button class="close-btn" @click="closeSearch">
                            <X :size="20" />
                        </button>
                    </template>
                </Input>
            </template>
            <template #body>
                <div class="search-content">
                    <div v-if="titlesStore.isProcessing" class="search-loading">
                        <LoaderIcon :size="24" class="animate-spin" />
                        <span>Hledám...</span>
                    </div>

                    <ul v-else-if="titlesStore.searchResults.length > 0" class="results">
                        <li v-for="title in titlesStore.searchResults" :key="title.id" class="result-item" @click="selectTitle(title)">
                            <img v-if="title.poster" :src="title.poster" class="poster" />
                            <Image v-else class="poster" />
                            <div class="info">
                                <span class="title">{{ title.title }}</span>
                                <span class="other">{{ title.year ?? "-" }} | {{ title.type }}</span>
                            </div>
                            <Plus :size="20" class="add-icon" />
                        </li>
                    </ul>

                    <div v-if="searchQuery.trim()" class="quick-add-option" @click="handleQuickAdd">
                        <div class="quick-add-icon">
                            <Plus :size="20" />
                        </div>
                        <span>Přidat jako vlastní: "<strong>{{ searchQuery }}</strong>"</span>
                    </div>
                </div>
            </template>
        </Overlay>
    </main>
</template>

<style scoped src="../styles/watchlistDetail.css"></style>

<script setup lang="ts">
import { ChevronRight, Image, Library, LoaderIcon, Plus, Search, Settings, X } from "lucide-vue-next";
import { useWatchlistsStore } from "../stores/watchlists.store";
import Header from "../components/Header.vue";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useTitlesStore } from "../stores/titles.store";
import type { Title, WatchListItem } from "../api";
import DraggableList from "../components/DraggableList.vue";
import Overlay from "../components/Overlay.vue";
import Input from "../components/Input.vue";
import Triage from "../components/Triage.vue";

const props = defineProps<{ listId: string }>();

const router = useRouter();
const watchlistsStore = useWatchlistsStore();
const titlesStore = useTitlesStore();
const list = computed(() => watchlistsStore.lists.find((l) => l.id === props.listId));
const availableFilters = computed(() => watchlistsStore.availableListFilters(props.listId));
const isFilterExpanded = ref(false);
const filterQuery = ref("");
const genreFilters = ref<Record<string, string>>({});
const maxDurationFilter = ref<number>(0);
const isSearchExpanded = ref(false);
const searchQuery = ref("");
const activeItems = computed({
    get() {
        return watchlistsStore.enrichedListItems(props.listId)
            .filter(i => {
                if (i.state === "finished") return false;

                const matchesText = i.displayTitle.toLowerCase().includes(filterQuery.value.toLowerCase());
                if (!matchesText) return false;

                if (i.details?.durationMinutes && i.details.durationMinutes > maxDurationFilter.value) return false;

                const filterEntries = Object.entries(genreFilters.value);
                if (filterEntries.length > 0) {
                    const matchesGenres = filterEntries.every(([genre, state]) => {
                        if (state === "positive") return i.resolvedGenres.includes(genre);
                        if (state === "negative") return !i.resolvedGenres.includes(genre);
                        return true;
                    });
                    if (!matchesGenres) return false;
                }

                return true;
            })
            .sort((a, b) => (a.sortKey || "").localeCompare(b.sortKey || ""));
    },
    set(newActiveArray) {
        const finished = (watchlistsStore.listItems[props.listId] ?? []).filter(i => i.state === "finished");
        watchlistsStore.listItems[props.listId] = [...newActiveArray, ...finished];
    }
});
const finishedItems = computed(() => {
    return processItems()
        .filter(i => i.state === "finished" && i.details?.title.toLowerCase().includes(filterQuery.value.toLowerCase()))
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
});

onMounted(() => watchlistsStore.fetchSingleList(props.listId));

watch(availableFilters, (newFilters) => {
    // Init of filters
    if (newFilters.durationRange.max > 0 && maxDurationFilter.value === 0) {
        maxDurationFilter.value = newFilters.durationRange.max;
    }
}, { immediate: true });

function processItems() {
    const listItems = watchlistsStore.listItems[props.listId] ?? [];
    return listItems.map((item) => ({ ...item, details: titlesStore.titles[item.titleId] }));
};

function openSettings() {
    router.push({ name: "watchlistSettings", params: { listId: props.listId } });
}

function goToItem(id: string) {
    router.push({ name: "watchlistItem", params: { listId: props.listId, itemId: id } });
}

function openFilter() {
    isFilterExpanded.value = true;
}

function openSearch() {
    isSearchExpanded.value = true;
}

function closeFilter() {
    isFilterExpanded.value = false;
}

function closeSearch() {
    isSearchExpanded.value = false;
    searchQuery.value = "";
    titlesStore.clearSearchResults();
}

function resetFilters() {
    filterQuery.value = "";
    maxDurationFilter.value = availableFilters.value.durationRange.max;
    genreFilters.value = {};
}

async function handleQuickAdd() {
    if (!searchQuery.value.trim()) return;

    await watchlistsStore.addItemToList(props.listId, { name: searchQuery.value });
    searchQuery.value = "";
}

async function handleSearch() {
    if (!searchQuery.value.trim()) return;

    await titlesStore.search(searchQuery.value);
    isSearchExpanded.value = true;
}

async function selectTitle(title: Title) {
    await watchlistsStore.addItemToList(props.listId, { title });

    searchQuery.value = "";
    isSearchExpanded.value = false;
    titlesStore.clearSearchResults();
}

async function handleItemState(item: WatchListItem) {
    const newState = (item.state === "finished" ? "planned" : "finished") as WatchListItem.state;
    // await watchlistsStore.updateItemState(props.listId, item.id, newState);
}
</script>