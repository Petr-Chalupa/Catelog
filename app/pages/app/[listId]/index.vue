<template>
    <Header>
        <template #center>
            <span>
                <ClientOnly fallback="Unknown list">{{ list?.name ?? "Unknown list" }}</ClientOnly>
            </span>
        </template>
        <template #actions>
            <Icon name="lucide:filter" :size="25" @click="goToListFilter" />
            <Icon name="lucide:settings" :size="25" @click="goToListSettings" />
        </template>
    </Header>

    <main>
        <LoadingState v-if="isLoadingLists || itemsQuery.isLoading.value" />

        <EmptyState v-else-if="!list">This seems like an error</EmptyState>

        <EmptyState v-else-if="items.length === 0" />

        <section class="items" v-else>
            <List :items="items" isDraggable @item-moved="({ element, newIndex }) => reorderItems(listId, element, newIndex)" @row-click="goToListItem">
                <template #body="{ item }: { item: WatchlistItemPublic }">
                    <Image :src="item.title.poster" />
                    <div class="info">
                        <span class="title">{{ localeTitle(item.title.titles) }}</span>
                        <span class="other">{{ item.title.year ?? "?" }} | {{ item.title.type }}</span>
                        <span class="genres">
                            <span v-for="genre in resolveGenres(item.title.genres, item.addedGenres, item.excludedGenres).slice(0, 3)" :key="genre" class="genre-tag">
                                {{ genre }}
                            </span>
                        </span>
                    </div>
                </template>
                <template #actions="{ item }: { item: WatchlistItemPublic }">
                    <ItemWatchedStateButton :list-id="listId" :item="item" />
                </template>
            </List>
        </section>

        <section class="add">
            <Input placeholder="New item's title" v-model="newItemTitle" :actions="[{ icon: 'lucide:search', cb: goToTitleSearch }, { icon: 'lucide:plus', cb: handleCreateItem }]"
                @enter="handleCreateItem" v-online-only />
        </section>
    </main>
</template>

<style scoped src="~/assets/styles/watchlist.css"></style>

<script setup lang="ts">
const route = useRoute();
const { localeTitle, resolveGenres } = useTitle();
const { lists, isLoadingLists, useItems, createItemPrivate, reorderItems } = useWatchlists();
const { getFilteredItems } = useWatchlistFiltersStore();

const listId = computed(() => route.params.listId as string);
const list = computed(() => lists.value?.find((l) => l._id === listId.value));
const itemsQuery = useItems(listId);
const items = computed(() => getFilteredItems(itemsQuery.data.value ?? []));
const newItemTitle = ref("");

function goToListFilter() {
    navigateTo(`/app/${listId.value}/filter`);
}

function goToListSettings() {
    navigateTo(`/app/${listId.value}/settings`);
}

function goToListItem(item: WatchlistItemPublic) {
    navigateTo(`/app/${listId.value}/${item._id}`);
}

function goToTitleSearch(title: string) {
    newItemTitle.value = "";
    navigateTo(`/app/${listId.value}/search?q=${title}`);
}

function handleCreateItem(title: string) {
    newItemTitle.value = "";
    createItemPrivate({ listId: listId.value, title });
}
</script>