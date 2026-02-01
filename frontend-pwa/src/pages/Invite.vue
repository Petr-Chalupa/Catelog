<template>
    <main>
        <div v-if="loading" class="loading-container">
            <LoaderIcon class="animate-spin" :size="48" />
            <p>{{ $t("invite.loading") }}</p>
        </div>

        <div v-else-if="error" class="error-container">
            <h2>{{ $t("invite.err-title") }}</h2>
            <p>{{ error }}</p>
            <button @click="router.push('/')" class="btn-home">{{ $t("invite.goHome") }}</button>
        </div>

        <div v-else-if="invite" class="invite-container">
            <h1>{{ $t("invite.title") }}</h1>

            <InviteCard :invite="invite" size="large" :disabled="userStore.isProcessing" @accept="handleAccept" @decline="handleDecline" />
        </div>
    </main>
</template>

<style scoped>
main {
    text-align: center;
}

.error-container h2 {
    color: var(--danger);
}

.btn-home {
    margin-top: 2rem;
    padding: 0.75rem 1.25rem;
    background: var(--primary);
    border: 1px solid var(--border);
    border-radius: 4px;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { InvitesService, type Invite } from "../api";
import InviteCard from "../components/InviteCard.vue";
import { useUserStore } from "../stores/user.store";
import { LoaderIcon } from "lucide-vue-next";
import { useConfirmStore } from "../stores/confirm.store";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const confirmStore = useConfirmStore();
const invite = ref<Invite | null>(null);
const loading = ref(true);
const error = ref("");
const token = route.params.token as string;

onMounted(async () => {
    try {
        invite.value = await InvitesService.getInvites1(token);
    } catch (err: any) {
        error.value = t("invite.err-msg");
    } finally {
        loading.value = false;
    }
});

async function handleAccept() {
    const success = await userStore.acceptInvite(token);
    if (success) router.push({ name: "watchlists" });
}

async function handleDecline() {
    const ok = await confirmStore.ask(t("invite.decline-title"), t("invite.decline-msg"));
    if (ok) {
        const succes = await InvitesService.deleteInvitesDecline(token);
        if (succes) router.push("/");
    }
}
</script>
