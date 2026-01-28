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
        <Transition name="slide-down">
            <section v-if="isFilterActive" class="filter">
                <div class="filter-bar">
                    <input v-model="filterQuery" placeholder="Hledat (název, režisér, žánr...)" />
                    <X class="close-btn" @click="handlePopState" />
                </div>
            </section>
        </Transition>

        <section v-if="watchlistsStore.isInitialLoading" class="loading-state">
            <LoaderIcon :size="48" class="animate-spin" />
            <p>Loading items...</p>
        </section>

        <section v-else-if="items.length == 0" class="empty-state">
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

        <Transition name="fade">
            <section v-if="isSearchExpanded" class="search-overlay">
                <div class="search-header">
                    <div class="search-bar">
                        <input v-model="searchQuery" type="text" placeholder="Hledat film nebo přidat vlastní..." @keyup.enter="handleSearch" />
                        <button class="search-btn" @click="handleSearch" :disabled="titlesStore.isProcessing">
                            <Search v-if="!titlesStore.isProcessing" :size="20" />
                            <LoaderIcon v-else :size="20" class="animate-spin" />
                        </button>
                        <button class="close-btn" @click="handlePopState">
                            <X :size="20" />
                        </button>
                    </div>
                </div>

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
            </section>
        </Transition>
    </main>
</template>

<style scoped src="../styles/watchlistDetail.css"></style>

<script setup lang="ts">
import { ChevronRight, Image, Library, LoaderIcon, Plus, Search, Settings, X } from "lucide-vue-next";
import { useWatchlistsStore } from "../stores/watchlists.store";
import Header from "../components/Header.vue";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTitlesStore } from "../stores/titles.store";
import type { Title, WatchListItem } from "../api";
import DraggableList from "../components/DraggableList.vue";

const props = defineProps<{ listId: string }>();

const router = useRouter();
const watchlistsStore = useWatchlistsStore();
const titlesStore = useTitlesStore();
const list = computed(() => watchlistsStore.lists.find((l) => l.id === props.listId));
const items = computed({
    get() {
        let listItems = watchlistsStore.listItems[props.listId] ?? [];

        return [...listItems]
            .sort((a, b) => (a.sortKey || "").localeCompare(b.sortKey || ""))
            .map((item) => ({ ...item, details: titlesStore.titles[item.titleId] }))
            .filter((i) => i.details?.title.toLowerCase().includes(filterQuery.value.toLowerCase()));
    },
    set(newArray) {
        watchlistsStore.listItems[props.listId] = newArray;
    }
});
const activeItems = computed({
    get() {
        return processItems()
            .filter(i => i.state !== "finished" && i.details?.title.toLowerCase().includes(filterQuery.value.toLowerCase()))
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
const isFilterActive = ref(false);
const filterQuery = ref("");
const isSearchExpanded = ref(false);
const searchQuery = ref("");

onMounted(() => {
    watchlistsStore.fetchSingleList(props.listId)
    window.addEventListener("popstate", handlePopState);
});

onUnmounted(() => {
    window.removeEventListener("popstate", handlePopState);
});

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
    isFilterActive.value = true;
    window.history.pushState({ mode: "filter" }, "");
}

function openSearch() {
    isSearchExpanded.value = true;
    window.history.pushState({ mode: "add" }, "");
}

function handlePopState() {
    isFilterActive.value = false;
    filterQuery.value = "";
    isSearchExpanded.value = false;
    searchQuery.value = "";
    titlesStore.clearSearchResults();
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