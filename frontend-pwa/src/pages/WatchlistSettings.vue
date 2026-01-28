<template>
    <Header>
        <template #center>
            <span>List settings</span>
        </template>
    </Header>

    <main v-if="watchlistsStore.isInitialLoading" class="loading-state">
        <LoaderIcon class="animate-spin" :size="48" />
        <p>Loading settings...</p>
    </main>
    <main v-else>
        <section class="settings-group">
            <h3 class="group-title">Name</h3>

            <div class="settings-item change-name">
                <Input v-model="editName" :disabled="watchlistsStore.isProcessing" @enter="handleSaveName">
                    <template #actions>
                        <button :disabled="!editName.trim().length" @click="handleSaveName">
                            <Save v-if="!watchlistsStore.isProcessing" :size="18" />
                            <LoaderIcon v-else :size="18" class="animate-spin" />
                        </button>
                    </template>
                </Input>
            </div>
        </section>

        <section class="settings-group">
            <h3 class="group-title">Sharing</h3>

            <div class="settings-item add-member">
                <Input v-model="addMemberEmail" placeholder="E-mail" :disabled="watchlistsStore.isProcessing" @enter="addMember">
                    <template #actions>
                        <button :disabled="!isOwner || !addMemberEmail.trim().length" @click="addMember">
                            <Plus v-if="!watchlistsStore.isProcessing" :size="18" />
                            <LoaderIcon v-else :size="18" class="animate-spin" />
                        </button>
                    </template>
                </Input>
            </div>
            <div class="settings-item members">
                <span v-if="members.length == 0">No other members.</span>
                <div v-for="member in members" :key="member.id" class="member">
                    <span>{{ member.name }}</span>
                    <span class="actions">
                        <ShieldUser v-if="!watchlistsStore.isProcessing && isOwner" :size="24" class="transfer" @click="handleTransfer(member.id)" />
                        <Trash v-if="!watchlistsStore.isProcessing && isOwner" :size="24" class="remove" @click="handleMemberRemove(member.id)" />
                        <LoaderIcon v-if="watchlistsStore.isProcessing" :size="24" class="animate-spin" />
                    </span>
                </div>
            </div>
            <div class="settings-item invites">
                <span v-if="invites.length == 0">No pending invites.</span>
                <div v-for="invite in invites" :key="invite.id" class="invite">
                    <span>Invited > {{ invite.inviteeName }}</span>
                    <span class="actions">
                        <Trash v-if="!watchlistsStore.isProcessing && isOwner" :size="24" class="remove" @click="handleInviteRemove(invite.id)" />
                        <LoaderIcon v-if="watchlistsStore.isProcessing" :size="24" class="animate-spin" />
                    </span>
                </div>
            </div>
        </section>

        <section class="settings-group">
            <button @click="handleDelete" class="btn-delete">Delete List</button>
        </section>
    </main>
</template>

<style scoped src="../styles/settings.css"></style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import Header from "../components/Header.vue";
import { useWatchlistsStore } from "../stores/watchlists.store";
import { LoaderIcon, Plus, Save, ShieldUser, Trash } from "lucide-vue-next";
import { useUserStore } from "../stores/user.store";
import { useRouter } from "vue-router";
import Input from "../components/Input.vue";

const props = defineProps<{ listId: string }>();

const router = useRouter();
const userStore = useUserStore();
const watchlistsStore = useWatchlistsStore();
const editName = ref("");
const list = computed(() => watchlistsStore.lists.find((l) => l.id === props.listId));
const members = computed(() => watchlistsStore.listMembers[props.listId] || []);
const invites = computed(() => watchlistsStore.listInvites[props.listId] || []);
const isOwner = computed(() => list.value?.ownerId === userStore.profile.id);
const addMemberEmail = ref("");

watch(list, (newList) => {
    if (newList) editName.value = newList.name;
}, { immediate: true });

onMounted(() => watchlistsStore.fetchSingleList(props.listId));

async function handleSaveName() {
    await watchlistsStore.patchWatchlist(props.listId, { name: editName.value });
}

async function addMember() {
    await watchlistsStore.sendInvite(props.listId, addMemberEmail.value);
    addMemberEmail.value = "";
}

async function handleMemberRemove(userId: string) {
    if (confirm("Remove this user from this list?")) {
        await watchlistsStore.removeMember(props.listId, userId);
    }
}

async function handleInviteRemove(inviteId: string) {
    if (confirm("Revoke this invite?")) {
        await watchlistsStore.revokeInvite(inviteId, props.listId);
    }
}

async function handleTransfer(userId: string) {
    if (confirm("Transfer this list to this user?")) {
        await watchlistsStore.transferOwnership(props.listId, userId);
    }
}

async function handleDelete() {
    if (confirm("PERMANENTLY delete list? This cannot be undone.")) {
        const success = await watchlistsStore.deleteList(props.listId);
        if (success) router.push({ name: "watchlists" });
    }
}
</script>