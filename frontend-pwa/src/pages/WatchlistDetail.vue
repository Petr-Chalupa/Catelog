<template>
    <Header>
        <template #center>
            <span>{{ list?.name }}</span>
        </template>
        <template #actions>
            <Settings @click="openSettings()" />
        </template>
    </Header>

    <main>
        <section v-if="watchlistsStore.isInitialLoading" class="loading-state">
            <LoaderIcon :size="48" class="animate-spin" />
            <p>Loading items...</p>
        </section>

        <section v-else-if="items.length == 0" class="empty-state">
            <Library :size="48" />
            <p>No items found. Create one to get started!</p>
        </section>

        <DraggableList v-else :items="items" @row-click="goToItem($event.id)" @item-moved="({ element, newArray }) => watchlistsStore.updateListItemOrder(listId, newArray, element)">
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
                <input type="radio" class="watched-btn" @click.stop="" />
            </template>
        </DraggableList>

        <section class="add-item">
            <div v-if="isSearchExpanded" class="results">
                <ul v-if="titlesStore.searchResults.length > 0">
                    <li v-for="title in titlesStore.searchResults" :key="title.id" class="result-item" @click="selectTitle(title)">
                        <img v-if="title.poster" :src="title.poster" :alt="title.title" class="poster" />
                        <Image v-else class="poster" />
                        <div class="info">
                            <span class="title">{{ title.title }}</span>
                            <span class="other">{{ title.year ?? "-" }} | {{ title.type }}</span>
                        </div>
                    </li>
                </ul>
                <div v-else class="no-results">
                    No results found
                </div>
            </div>

            <div class="bar">
                <input v-model="query" type="text" placeholder="Add movie or show..." @keyup.enter="handleQuickAdd" @keydown.esc="closeSearch" />
                <div class="actions">
                    <button @click="handleQuickAdd" :disabled="watchlistsStore.isProcessing">
                        <Plus v-if="!watchlistsStore.isProcessing" :size="20" />
                        <LoaderIcon v-else :size="20" class="animate-spin" />
                    </button>
                    <button @click="handleSearch" :disabled="titlesStore.isProcessing">
                        <Search v-if="!titlesStore.isProcessing" :size="20" />
                        <LoaderIcon v-else :size="20" class="animate-spin" />
                    </button>
                </div>
            </div>
        </section>
    </main>
</template>

<style scoped src="../styles/watchlistDetail.css"></style>

<script setup lang="ts">
import { Image, Library, LoaderIcon, Plus, Search, Settings } from "lucide-vue-next";
import { useWatchlistsStore } from "../stores/watchlists.store";
import Header from "../components/Header.vue";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTitlesStore } from "../stores/titles.store";
import type { Title } from "../api";
import DraggableList from "../components/DraggableList.vue";

const props = defineProps<{ listId: string }>();

const router = useRouter();
const watchlistsStore = useWatchlistsStore();
const titlesStore = useTitlesStore();
const list = computed(() => watchlistsStore.lists.find((l) => l.id === props.listId));
const items = computed({
    get() {
        const listItems = watchlistsStore.listItems[props.listId] ?? [];
        return [...listItems]
            .sort((a, b) => (a.sortKey || "").localeCompare(b.sortKey || ""))
            .map((item) => ({ ...item, details: titlesStore.titles[item.titleId] }));
    },
    set(newArray) {
        watchlistsStore.listItems[props.listId] = newArray;
    }
});
const query = ref("");
const isSearchExpanded = ref(false);

onMounted(() => watchlistsStore.fetchSingleList(props.listId));

function openSettings() {
    router.push({ name: "watchlistSettings", params: { listId: props.listId } });
}

function goToItem(id: string) {
    router.push({ name: "watchlistItem", params: { listId: props.listId, itemId: id } });
}

function closeSearch() {
    isSearchExpanded.value = false;
    titlesStore.clearSearchResults();
}

async function handleQuickAdd() {
    if (!query.value.trim()) return;

    await watchlistsStore.addItemToList(props.listId, { name: query.value });
    query.value = "";
}

async function handleSearch() {
    if (!query.value.trim()) return;

    await titlesStore.search(query.value);
    isSearchExpanded.value = true;
}

async function selectTitle(title: Title) {
    await watchlistsStore.addItemToList(props.listId, { title });

    query.value = "";
    isSearchExpanded.value = false;
    titlesStore.clearSearchResults();
}
</script>