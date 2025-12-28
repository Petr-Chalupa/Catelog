<template>
    <Header>
        <template #left>
            <router-link to="/profile" class="profile">
                <CircleUserRound />
                <div class="info">
                    <span class="name">{{ userStore.profile.name }}</span>
                    <span class="email">{{ userStore.profile.email }}</span>
                </div>
            </router-link>
        </template>
    </Header>

    <main v-if="watchlistsStore.isInitialLoading" class="loading-state">
        <LoaderIcon :size="48" class="animate-spin" />
        <p>Loading watchlists...</p>
    </main>
    <main v-else-if="watchlistsStore.lists.length == 0" class="empty-state">
        <Library :size="48" />
        <p>No watchlists found. Create one to get started!</p>
    </main>
    <main v-else>
        <DraggableList :items="watchlistsStore.sortedLists" title-key="name" @row-click="goToList($event.id)" @item-moved="({ element, newArray }) => watchlistsStore.updateListOrder(newArray, element)">
            <template #meta="{ item }">
                <span class="shared">
                    <Users :size="14" /> {{ item.sharedWith.length + 1 }}
                </span>
                <span class="items">
                    <Library :size="16" />{{ watchlistsStore.listItems[item.id]?.length || 0 }}
                </span>
            </template>
            <template #actions="{ item }">
                <button @click.stop="openSettings(item.id)">
                    <Settings :size="18" />
                </button>
            </template>
        </DraggableList>

        <section class="create-section">
            <input v-model="newListName" type="text" placeholder="Name..." @keyup.enter="createNewList" />
            <button @click="createNewList" :disabled="watchlistsStore.isProcessing || !newListName.trim()">
                <Plus v-if="!watchlistsStore.isProcessing" :size="20" />
                <LoaderIcon v-else :size="20" class="animate-spin" />
            </button>
        </section>
    </main>
</template>

<style scoped src="../styles/watchlists.css"></style>

<script setup lang="ts">
import { useUserStore } from "../stores/user.store";
import { CircleUserRound, Library, LoaderIcon, Plus, Settings, Users } from "lucide-vue-next";
import Header from "../components/Header.vue";
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { useWatchlistsStore } from "../stores/watchlists.store";
import DraggableList from "../components/DraggableList.vue";

const userStore = useUserStore();
const watchlistsStore = useWatchlistsStore();
const router = useRouter();
const newListName = ref("");

onMounted(() => watchlistsStore.fetchLists());

function goToList(id: string) {
    router.push({ name: "watchlistDetails", params: { listId: id } });
}

function openSettings(id: string) {
    router.push({ name: "watchlistSettings", params: { listId: id } });
}

async function createNewList() {
    const name = newListName.value.trim()
    await watchlistsStore.createWatchlist(name);
};
</script>
