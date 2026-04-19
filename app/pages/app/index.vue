<template>
    <Header>
        <template #left>
            <NuxtLink to="/app/profile" class="profile" v-if="user">
                <Image :src="user.image" fallback="lucide:circle-user-round" />
                <div class="info">{{ user.name }}</div>
            </NuxtLink>
        </template>
    </Header>

    <main>
        <LoadingState v-if="isLoadingLists" />

        <EmptyState v-else-if="!lists || lists.length === 0" />

        <section class="lists" v-else>
            <List :items="lists" isDraggable @item-moved="({ element, newIndex }) => reorderLists(element, newIndex)" @row-click="goToList">
                <template #body="{ item }: { item: WatchlistPublic }">
                    <h3>{{ item.name }}</h3>
                    <span class="shared">
                        <Icon name="lucide:users" :size="16" /> {{ item.sharedWith.length + 1 }}
                    </span>
                </template>
            </List>
        </section>

        <section class="create">
            <Input placeholder="New list's name" v-model="newListName" :actions="[{ icon: 'lucide:plus', cb: handleCreateList }]" @enter="handleCreateList" v-online-only />
        </section>
    </main>
</template>

<style scoped src="~/assets/styles/app.css"></style>

<script setup lang="ts">
const { user } = useUser();
const { getSortedLists, isLoadingLists, createList, reorderLists } = useWatchlists();
const lists = computed(() => getSortedLists.value);
const newListName = ref("");

function goToList(list: WatchlistPublic) {
    navigateTo(`/app/${list._id}`);
}

function handleCreateList(name: string) {
    newListName.value = "";
    createList(name);
}
</script>