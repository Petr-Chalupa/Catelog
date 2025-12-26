<template>
    <Header>
        <router-link to="/profile" class="profile">
            <CircleUserRound />
            <div class="info">
                <span class="name">{{ userStore.profile.name }}</span>
                <span class="email">{{ userStore.profile.email }}</span>
            </div>
        </router-link>
    </Header>

    <main>
        <DraggableList v-if="watchlistsStore.lists.length" :items="watchlistsStore.sortedLists" title-key="name" @row-click="goToList($event.id)" @item-moved="({ element, newArray }) => watchlistsStore.updateListOrder(newArray, element)">
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
                    <Settings :size="18" @click.stop="openSettings(item.id)" />
                </button>
            </template>
        </DraggableList>
        <div v-else class="empty-state">
            <Library :size="48" />
            <p>No watchlists found. Create one to get started!</p>
        </div>

        <section class="create-section">
            <input v-model="newListModel.name" type="text" placeholder="Name..." @keyup.enter="createNewList" />
            <button @click="createNewList" :disabled="!newListModel.name.trim()">
                <Plus :size="20" />
            </button>
        </section>
    </main>
</template>

<style scoped src="../styles/watchlists.css"></style>

<script setup lang="ts">
import { useUserStore } from "../stores/user.store";
import { CircleUserRound, Library, Plus, Settings, Users } from "lucide-vue-next";
import Header from "../components/Header.vue";
import { WatchListsService } from "../api";
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { useWatchlistsStore } from "../stores/watchlists.store";
import DraggableList from "../components/DraggableList.vue";

const userStore = useUserStore();
const watchlistsStore = useWatchlistsStore();
const router = useRouter();
const newListModel = ref({ name: "" });

function goToList(id: string) {
    router.push({ name: "watchlistDetails", params: { listId: id } });
}

function openSettings(id: string) {
    router.push({ name: "watchlistSettings", params: { listId: id } });
}

async function createNewList() {
    const name = newListModel.value.name.trim()
    await WatchListsService.postWatchlists({ name });
    await watchlistsStore.fetchLists();
};

onMounted(() => watchlistsStore.fetchLists());
</script>
