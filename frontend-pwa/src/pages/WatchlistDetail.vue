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

        <DraggableList v-else :items="items" @row-click="goToItem($event.id)" @item-moved="">
            <template #body="{ item }">
                {{ item.details.title }}
            </template>
            <template #actions="{ item }">
            </template>
        </DraggableList>

        <section class="add-item">
            <div v-if="isSearchExpanded" class="results">
                {{ titlesStore.searchResults }}
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
import { Library, LoaderIcon, Plus, Search, Settings, X } from "lucide-vue-next";
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
const items = computed(() => {
    const listItems = watchlistsStore.listItems[props.listId] ?? [];
    return listItems.map((item) => ({ ...item, details: titlesStore.titles[item.titleId] }));
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