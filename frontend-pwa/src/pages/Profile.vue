<template>
    <Header>
        <template #center>
            <span>Profile</span>
        </template>
    </Header>

    <main v-if="userStore.isInitialLoading && !userStore.profile.id" class="loading-state">
        <LoaderIcon class="animate-spin" :size="48" />
        <p>Loading profile...</p>
    </main>
    <main v-else>
        <section class="profile-card">
            <div class="avatar-circle">
                {{ userStore.profile.name?.charAt(0) }}
            </div>
            <div class="user-info">
                <h2>{{ userStore.profile.name }}</h2>
                <p>{{ userStore.profile.email }}</p>
            </div>
        </section>

        <section class="settings-group">
            <h3 class="group-title">Preferences</h3>

            <div class="settings-item">
                <label for="theme">Theme</label>
                <select id="theme" v-model="userStore.theme" :disabled="userStore.isProcessing">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                </select>
            </div>

            <div class="settings-item">
                <label for="language">Language</label>
                <select id="language" v-model="userStore.locale" :disabled="userStore.isProcessing">
                    <option value="en">English</option>
                    <option value="cs">Čeština</option>
                </select>
            </div>
        </section>

        <section class="settings-group">
            <h3 class="group-title">Notifications</h3>
            <div class="settings-item">
                <span>Push Notifications</span>
                <input type="checkbox" :checked="userStore.profile.notificationsEnabled" :disabled="userStore.isProcessing" @change="handleNotificationToggle" />
            </div>
        </section>

        <section class="settings-group invites-section">
            <h3 class="group-title">Pending Invites</h3>

            <div v-if="userStore.invites.length === 0" class="no-invites">
                <p>No pending invites at the moment.</p>
            </div>
            <div v-else class="invite-list">
                <InviteCard v-for="i in userStore.invites" :invite="i" size="small" :disabled="userStore.isProcessing" @accept="userStore.acceptInvite(i.id)"
                    @decline="userStore.declineInvite(i.id)" />
            </div>
        </section>

        <section class="settings-group">
            <button @click="handleLogout" :disabled="userStore.isProcessing" class="btn-logout" v-onlineonly>Sign Out</button>
            <button @click="handleDelete" :disabled="userStore.isProcessing" class="btn-delete" v-onlineonly>Delete Account</button>
        </section>
    </main>
</template>

<style scoped src="../styles/settings.css"></style>

<script setup lang="ts">
import { onMounted } from "vue";
import { useUserStore } from "../stores/user.store";
import { useAuthStore } from "../stores/auth.store";
import Header from "../components/Header.vue";
import InviteCard from "../components/InviteCard.vue";
import { LoaderIcon } from "lucide-vue-next";
import { useConfirmStore } from "../stores/confirm.store";

const authStore = useAuthStore();
const userStore = useUserStore();
const confirmStore = useConfirmStore();

onMounted(async () => userStore.fetchProfile());

async function handleNotificationToggle(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    try {
        await userStore.toggleNotifications(checkbox.checked);
    } catch (error) {
        checkbox.checked = !checkbox.checked; // Revert on failure
    }
}

async function handleLogout() {
    const ok = await confirmStore.ask("Sign out", "Are you sure?");
    if (ok) {
        authStore.logout();
    }
}

async function handleDelete() {
    const ok = await confirmStore.ask("Delete account", "PERMANENTLY delete account? This cannot be undone.");
    if (ok) {
        const success = await userStore.deleteAccount();
        if (success) authStore.logout();
    }
}
</script>