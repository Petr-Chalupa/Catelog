<template>
    <Header>
        <span>Profile</span>
    </Header>

    <main>
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
                <select id="theme" v-model="userStore.theme">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                </select>
            </div>

            <div class="settings-item">
                <label for="language">Language</label>
                <select id="language" v-model="userStore.locale">
                    <option value="en">English</option>
                    <option value="cs">Čeština</option>
                </select>
            </div>
        </section>

        <section class="settings-group">
            <h3 class="group-title">Notifications</h3>
            <div class="settings-item">
                <span>Push Notifications</span>
                <input type="checkbox" :checked="userStore.profile.notificationsEnabled" @change="togglePush" />
            </div>
        </section>

        <section class="settings-group invites-section">
            <h3 class="group-title">Pending Invites</h3>

            <div v-if="invites.length === 0" class="no-invites">
                <p>No pending invites at the moment.</p>
            </div>
            <div v-else class="invite-list">
                <InviteCard v-for="i in invites" :invite="i" size="small" />
            </div>
        </section>

        <section class="settings-group">
            <button @click="handleLogout" class="btn-logout">Sign Out</button>
            <button @click="confirmDelete" class="btn-delete">Delete Account</button>
        </section>
    </main>
</template>

<style scoped src="../styles/profile.css"></style>

<script setup lang="ts">
import { onMounted, ref, type Ref } from "vue";
import { InvitesService, UserService, type Invite, type UserDevice } from "../api";
import { useUserStore } from "../stores/user.store";
import { useAuthStore } from "../stores/auth.store";
import Header from "../components/Header.vue";
import InviteCard from "../components/InviteCard.vue";

const authStore = useAuthStore();
const userStore = useUserStore();
const invites: Ref<Invite[]> = ref([]);

onMounted(async () => {
    try {
        userStore.setProfile(await UserService.getUserMe());
        invites.value = await InvitesService.getInvites("incoming");
    } catch (e) {
        console.error("Silent profile refresh failed");
    }
});

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function getDeviceName() {
    const ua = navigator.userAgent;
    if (ua.includes("iPhone")) return "iPhone";
    if (ua.includes("iPad")) return "iPad";
    if (ua.includes("Android")) return "Android Device";
    if (ua.includes("Windows")) return "Windows PC";
    if (ua.includes("Macintosh")) return "MacBook/iMac";
    return "Web Browser";
};

async function togglePush(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const isCheckingOn = checkbox.checked;

    try {
        if (isCheckingOn) {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                checkbox.checked = false;
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
                });
            }
            const raw = subscription.toJSON();
            const deviceData: UserDevice = {
                deviceName: getDeviceName(),
                endpoint: raw.endpoint!,
                keys: { p256dh: raw.keys!.p256dh!, auth: raw.keys!.auth! }
            };

            await UserService.postUserDevicesSubscribe(deviceData);
        } else {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await UserService.postUserDevicesUnsubscribe({ endpoint: subscription.endpoint });
                await subscription.unsubscribe();
            }
        }

        const updatedUser = await UserService.patchUserMe({ ...userStore.profile, notificationsEnabled: isCheckingOn });
        userStore.setProfile(updatedUser);
    } catch (error) {
        console.error("Failed to toggle notifications:", error);
        checkbox.checked = !isCheckingOn;
    }
};


function handleLogout() {
    if (confirm("Are you sure you want to sign out?")) {
        authStore.logout();
    }
};

async function confirmDelete() {
    if (confirm("PERMANENTLY delete account? This cannot be undone.")) {
        await UserService.deleteUserMe();
    }
};
</script>