<template>
    <main>
        <div v-if="error" class="error-container">
            <h2>Oops!</h2>
            <p>{{ error }}</p>
            <button @click="router.push('/')" class="btn-home">Go Home</button>
        </div>

        <div v-else-if="invite" class="invite-container">
            <h1>You're Invited!</h1>

            <InviteCard :invite="invite" size="large" />
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

const route = useRoute();
const router = useRouter();
const invite = ref<Invite | null>(null);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
    const token = route.params.token as string;
    try {
        invite.value = await InvitesService.getInvites1(token);
    } catch (err: any) {
        if (err.status === 410) {
            error.value = "This invite has expired.";
        } else {
            error.value = "Invitation not found or invalid.";
        }
    } finally {
        loading.value = false;
    }
}); 
</script>
