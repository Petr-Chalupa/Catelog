<template>
    <Header>
        <template #center>
            <span>Merge - {{ item ? localeTitle(item.title.titles) : "Unknown item" }}</span>
        </template>
    </Header>

    <LoadingState v-if="isLoadingLists || itemsQuery.isLoading.value" />

    <EmptyState v-else-if="!list || !item">There is nothing to merge right now</EmptyState>

    <main v-else>
        <List :items="item.title.mergeCandidates" keyPath="displayData.poster">
            <template #body="{ item }: { item: MergeCandidate }">
                <Image :src="item.displayData.poster" />
                <div class="info">
                    <span class="title">{{ localeTitle(item.displayData.titles) }}</span>
                    <span class="other">{{ item.displayData.year ?? "?" }} | {{ item.displayData.type }}</span>
                </div>
            </template>
            <template #actions="{ item }: { item: MergeCandidate }">
                <Icon name="lucide:merge" :size="30" @click="handleMergeTitle(item)" v-online-only />
            </template>
        </List>
    </main>
</template>

<style scoped src="~/assets/styles/merge.css"></style>

<script setup lang="ts">
const route = useRoute();
const { localeTitle } = useTitle();
const { confirm } = useConfirm();
const { lists, isLoadingLists, useItems, mergeItem } = useWatchlists();

const listId = computed(() => route.params.listId as string);
const list = computed(() => lists.value?.find((l) => l._id === listId.value));

const itemId = computed(() => route.params.itemId as string);
const itemsQuery = useItems(listId);
const item = computed(() => itemsQuery.data.value?.find((i) => i._id === itemId.value));

async function handleMergeTitle(candidate: MergeCandidate) {
    const ok = await confirm("Merge Item", "This action is irreversible!");
    if (ok) {
        await mergeItem(listId.value, itemId.value, candidate);
        navigateTo(`/app/${listId.value}/${itemId.value}`);
    }
}
</script>