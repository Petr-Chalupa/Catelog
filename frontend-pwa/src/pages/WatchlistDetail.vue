<template>
    <Header>
        <template #center>
            <span>{{ list?.name }}</span>
        </template>
        <template #actions>
            <Settings @click="openSettings()" />
        </template>
    </Header>

    <main v-if="watchlistsStore.isInitialLoading" class="loading-state">
        <LoaderIcon :size="48" class="animate-spin" />
        <p>Loading items...</p>
    </main>
    <main v-else-if="items.length == 0" class="empty-state">
        <Library :size="48" />
        <p>No items found. Create one to get started!</p>
    </main>
    <main v-else>
        {{ items }}
    </main>
</template>

<style scoped src="../styles/watchlistDetail.css"></style>

<script setup lang="ts">
import { Library, LoaderIcon, Settings } from "lucide-vue-next";
import { useWatchlistsStore } from "../stores/watchlists.store";
import Header from "../components/Header.vue";
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{ listId: string }>();

const router = useRouter();
const watchlistsStore = useWatchlistsStore();
const list = computed(() => watchlistsStore.lists.find((l) => l.id === props.listId));
const items = computed(() => watchlistsStore.listItems[props.listId] ?? []);

function openSettings() {
    router.push({ name: "watchlistSettings", params: { listId: props.listId } });
}
</script>