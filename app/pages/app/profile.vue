<template>
    <Header>
        <template #center>
            <span>Profile</span>
        </template>
    </Header>

    <LoadingState v-if="isLoadingUser || isLoadingInvites" />

    <EmptyState v-else-if="!user">This seems like an error</EmptyState>

    <main v-else>
        <div class="profile-card">
            <Image :src="user.image" fallback="lucide:circle-user-round" />
            <div class="info">
                <h2>{{ user.name }}</h2>
                <p>{{ user.email }}</p>
            </div>
        </div>

        <section class="theme">
            <h3>Theme</h3>
            <div class="body">
                <select id="theme" v-model="colorMode.preference">
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </div>
        </section>

        <section class="notif">
            <h3>Push notifications</h3>
            <div class="body" v-online-only>
                <button v-if="!user.notificationsEnabled" @click="enableNotifications">Enable</button>
                <button v-else data-theme="danger" @click="disableNotifications">Disable</button>

                <button v-if="needsPermission" @click="requestPermission" data-theme="secondary">Grant permission</button>
            </div>
        </section>

        <section class="invites">
            <h3>Invites</h3>
            <div class="body">
                <i v-if="!invites || invites.length === 0" class="empty-hint">You have no incoming invites.</i>
                <div v-for="i in invites" :key="i._id" class="invite" v-online-only>
                    <div class="info">
                        <span>To: <span class="to">{{ i.list.name }}</span></span>
                        <span>From: <span class="from">{{ i.inviter.name ?? "Someone" }}</span></span>
                        <span class="expires">{{ expiresIn(i.expiresAt).msg }}</span>
                    </div>
                    <div class="actions">
                        <button @click="acceptInvite(i._id)">ACCEPT</button>
                        <button @click="declineInvite(i._id)" data-theme="danger">DECLINE</button>
                    </div>
                </div>
            </div>
        </section>

        <section class="danger">
            <h3>Danger zone</h3>
            <div class="body" v-online-only>
                <button @click="handleSignOut" data-theme="secondary">Sign Out</button>
                <button @click="handleDeleteAccount" data-theme="danger">Delete Account</button>
            </div>
        </section>
    </main>
</template>

<style scoped src="~/assets/styles/profile.css"></style>

<script setup lang="ts">
const colorMode = useColorMode();
const { needsPermission, requestPermission, enableNotifications, disableNotifications } = usePush();
const { confirm } = useConfirm();
const { user, isLoading: isLoadingUser, signOut, deleteAccount } = useUser();
const { invites, isLoading: isLoadingInvites, acceptInvite, declineInvite } = useInvites();

function expiresIn(expiresAt: Date) {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return { expired: true, msg: "Expired" };

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let msg = "";
    if (days > 0) {
        msg = `Expires in ${days} day(s)`;
    } else if (hours > 0) {
        msg = `Expires in ${hours} hour(s)`;
    } else if (minutes > 0) {
        msg = `Expires in ${minutes} minute(s)`;
    } else {
        msg = "Expires in less than a minute";
    }

    return { expired: false, msg };
}

async function handleSignOut() {
    const ok = await confirm("SIGN OUT", "Are you sure?");
    if (ok) await signOut();
}

async function handleDeleteAccount() {
    const ok = await confirm("DELETE YOUR ACCOUNT", "Are you sure? This action is irreversible!");
    if (ok) await deleteAccount();
}
</script>