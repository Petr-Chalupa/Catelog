<template>
    <Header>
        <template #left>
            <router-link to="/profile" class="profile">
                <CircleUserRound :size="30" />
                <div class="info">
                    <span class="name">{{ userStore.profile.name }}</span>
                    <span class="email">{{ userStore.profile.email }}</span>
                </div>
            </router-link>
        </template>
    </Header>

    <main v-if="watchlistsStore.isInitialLoading" class="loading-state">
        <LoaderIcon :size="48" class="animate-spin" />
        <p>{{ t("watchlists.loading") }}</p>
    </main>
    <main v-else>
        <section v-if="watchlistsStore.lists.length == 0" class="empty-state">
            <Library :size="48" />
            <p>{{ t("watchlists.no-lists") }}</p>
        </section>

        <DraggableList v-else :items="watchlistsStore.sortedLists" @row-click="goToList($event.id)" @item-moved="({ element, newArray }) => watchlistsStore.updateListOrder(newArray, element)">
            <template #body="{ item }">
                <h3>{{ item.name }}</h3>
                <span class="meta">
                    <span v-if="item.sharedWith.length > 0" class="shared">
                        <Users :size="16" /> {{ item.sharedWith.length }}
                    </span>
                    <span class="items">
                        <Library :size="16" />{{ watchlistsStore.listItems[item.id]?.length || 0 }}
                    </span>
                </span>
            </template>
            <template #actions="{ item }">
                <button @click.stop="openSettings(item.id)">
                    <Settings :size="20" />
                </button>
            </template>
        </DraggableList>

        <section class="create-section">
            <Input v-model="newListName" :placeholder="$t('watchlists.name')" @enter="createNewList">
                <template #actions>
                    <button @click="createNewList" :disabled="watchlistsStore.isProcessing || !newListName.trim()" v-onlineonly>
                        <Plus v-if="!watchlistsStore.isProcessing" :size="20" />
                        <LoaderIcon v-else :size="20" class="animate-spin" />
                    </button>
                </template>
            </Input>
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
import Input from "../components/Input.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
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
    await watchlistsStore.createList(name);
};
</script>
