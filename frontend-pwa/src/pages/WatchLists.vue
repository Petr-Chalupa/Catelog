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
        <section v-if="watchlistsStore.lists.length">
            <div class="list-grid">
                <div v-for="list in watchlistsStore.lists" :key="list.id" class="list-card" @click="goToList(list.id)">
                    <div class="card-content">
                        <h3>{{ list.name }}</h3>
                        <span class="shared">
                            <Users :size="16" class="shared-icon" /> {{ list.sharedWith.length + 1 }}
                        </span>
                    </div>
                    <div class="card-actions">
                        <button @click.stop="openSettings(list.id)" title="Settings">
                            <Settings :size="20" />
                        </button>
                    </div>
                </div>
            </div>
        </section>

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
