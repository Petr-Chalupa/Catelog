<template>
    <Header>
        <template #center>
            <span>{{ t("profile.title") }}</span>
        </template>
    </Header>

    <main v-if="userStore.isInitialLoading && !userStore.profile.id" class="loading-state">
        <LoaderIcon class="animate-spin" :size="48" />
        <p>{{ t("profile.loading") }}</p>
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
            <h3 class="group-title">{{ t("profile.preferences.title") }}</h3>

            <div class="settings-item">
                <label for="theme">{{ t("profile.preferences.theme") }}</label>
                <select id="theme" v-model="userStore.theme" :disabled="userStore.isProcessing">
                    <option value="dark">{{ t("profile.preferences.dark") }}</option>
                    <option value="light">{{ t("profile.preferences.light") }}</option>
                </select>
            </div>

            <div class="settings-item">
                <label for="language">{{ t("profile.preferences.language") }}</label>
                <select id="language" v-model="userStore.locale" :disabled="userStore.isProcessing">
                    <option value="en">{{ t("profile.preferences.en") }}</option>
                    <option value="cs">{{ t("profile.preferences.cs") }}</option>
                </select>
            </div>
        </section>

        <section class="settings-group">
            <h3 class="group-title">{{ t("profile.notifications.title") }}</h3>
            <div class="settings-item">
                <span>{{ t("profile.notifications.push") }}</span>
                <input type="checkbox" :checked="userStore.profile.notificationsEnabled" :disabled="userStore.isProcessing" @change="handleNotificationToggle" />
            </div>
        </section>

        <section class="settings-group invites-section">
            <h3 class="group-title">{{ t("profile.invites.title") }}</h3>

            <div v-if="userStore.invites.length === 0" class="no-invites">
                <p>{{ t("profile.invites.no-invites") }}</p>
            </div>
            <div v-else class="invite-list">
                <InviteCard v-for="i in userStore.invites" :invite="i" size="small" :disabled="userStore.isProcessing" @accept="userStore.acceptInvite(i.id)"
                    @decline="userStore.declineInvite(i.id)" />
            </div>
        </section>

        <section class="settings-group">
            <button @click="handleLogout" :disabled="userStore.isProcessing" class="btn-logout" v-onlineonly>{{ t("profile.sign-out") }}</button>
            <button @click="handleDelete" :disabled="userStore.isProcessing" class="btn-delete" v-onlineonly>{{ t("profile.delete-account") }}</button>
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
import { useI18n } from "vue-i18n";
import { useNotificationStore } from "../stores/notification.store";

const { t } = useI18n();
const authStore = useAuthStore();
const userStore = useUserStore();
const confirmStore = useConfirmStore();
const notificationStore = useNotificationStore();

onMounted(async () => userStore.fetchProfile());

async function handleNotificationToggle(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    try {
        await userStore.toggleNotifications(checkbox.checked);
    } catch (error) {
        checkbox.checked = !checkbox.checked; // Revert on failure
        notificationStore.addNotification(t("notifications.p-toggle-notifs-error"), "error");
    }
}

async function handleLogout() {
    const ok = await confirmStore.ask(t("profile.sign-out"), t("profile.sign-out-msg"));
    if (ok) {
        authStore.logout();
    }
}

async function handleDelete() {
    const ok = await confirmStore.ask(t("profile.delete-account"), t("profile.delete-account-msg"));
    if (ok) {
        const success = await userStore.deleteAccount();
        if (success) authStore.logout();
    }
}
</script>