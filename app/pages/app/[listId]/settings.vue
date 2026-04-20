<template>
    <Header>
        <template #center>
            <span>Settings - <ClientOnly fallback="Unknown list">{{ list?.name ?? "Unknown list" }}</ClientOnly></span>
        </template>
    </Header>

    <LoadingState v-if="isLoadingLists" />

    <EmptyState v-else-if="!list">This seems like an error</EmptyState>

    <main v-else>
        <section class="list-name">
            <h3>Watchlist Name</h3>
            <div class="body">
                <Input v-model="editName" :actions="[{ icon: 'lucide:save', cb: handleSaveName }]" @enter="handleSaveName" v-online-only />
            </div>
        </section>

        <section v-if="isOwner" class="sharing">
            <h3>Add Member</h3>
            <div class="body">
                <Input v-model="addMemberEmail" placeholder="User e-mail" :actions="[{ icon: 'lucide:plus', cb: handleAddMember }]" @enter="handleAddMember" v-online-only />
            </div>
        </section>

        <section class="members">
            <h3>Members</h3>
            <div class="body">
                <i v-if="members.length === 0" class="empty-hint">No other members yet.</i>
                <div v-for="member in members" :key="member._id" class="member-item">
                    <div class="info">
                        <span class="name">{{ member.name }}</span>
                    </div>
                    <div v-if="isOwner" class="actions">
                        <button @click="handleTransfer(member._id)" v-online-only>
                            <Icon name="lucide:shield-user" :size="20" />
                        </button>
                        <button @click="handleMemberRemove(member._id)" data-theme="danger" v-online-only>
                            <Icon name="lucide:trash" :size="20" />
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <section class="danger">
            <h3>Danger zone</h3>
            <div class="body" v-online-only>
                <button v-if="isOwner" @click="handleDelete" data-theme="danger">Delete Watchlist</button>
                <button v-else @click="handleLeave" data-theme="danger">Leave Watchlist</button>
            </div>
        </section>
    </main>
</template>

<style scoped src="~/assets/styles/settings.css"></style>

<script setup lang="ts">
const route = useRoute();
const { user } = useUser();
const { sendInvite } = useInvites();
const { lists, isLoadingLists, updateList, deleteList } = useWatchlists();
const { confirm } = useConfirm();

const listId = computed(() => route.params.listId as string);
const list = computed(() => lists.value?.find((l) => l._id === listId.value));
const members = computed(() => list.value?.sharedWith || []);
const isOwner = computed(() => list.value?.owner._id === user.value?._id);

const editName = ref("");
const addMemberEmail = ref("");

watch(list, (newList) => {
    if (newList && editName.value.length === 0) editName.value = newList.name;
}, { immediate: true });

async function handleSaveName() {
    if (!editName.value.trim() || editName.value === list.value?.name) return;

    await updateList({ listId: listId.value, body: { name: editName.value } });
}

async function handleAddMember() {
    if (!addMemberEmail.value.trim()) return;

    const email = addMemberEmail.value;
    addMemberEmail.value = "";

    await sendInvite({ listId: listId.value, email });
}

async function handleMemberRemove(userId: string) {
    const ok = await confirm("Remove Member", "Are you sure you want to remove this user?");
    if (ok) {
        const newMembers = members.value.filter((m) => m._id !== userId).map((m) => m._id);
        await updateList({ listId: listId.value, body: { sharedWith: newMembers } });
    }
}

async function handleTransfer(userId: string) {
    const ok = await confirm("Transfer Ownership", "You will no longer be the owner of this list.");
    if (ok) await updateList({ listId: listId.value, body: { ownerId: userId } });
}

async function handleDelete() {
    const ok = await confirm("Delete List", "This action is irreversible!");
    if (ok) {
        await deleteList(listId.value);
        navigateTo("/app");
    }
}

async function handleLeave() {
    const ok = await confirm("Leave List", "You will lose access to this watchlist.");
    if (ok) {
        const newMembers = members.value.filter((m) => m._id !== user.value?._id).map((m) => m._id);
        await updateList({ listId: listId.value, body: { sharedWith: newMembers } });
        navigateTo("/app");
    }
}
</script>