<template>
    <div class="invite-card" :class="size">
        <div class="invite-info">
            <p class="invite-text">
                <strong>{{ invite.inviterName }}</strong>
                invited you to join
            </p>
            <h3 class="watchlist-name">{{ invite.listName }}</h3>
            <span class="invite-date">{{ formatDate(invite.createdAt) }}</span>
        </div>

        <div v-if="isExpired" class="invite-actions">
            <button @click="handleAction('decline')" :disabled="disabled" class="btn-decline">
                Dismiss Expired Invite
            </button>
        </div>
        <div v-else class="invite-actions">
            <button @click="handleAction('accept')" :disabled="disabled" class="btn-accept">
                {{ isLoggedIn ? "Accept" : "Login to Accept" }}
            </button>

            <button @click="handleAction('decline')" :disabled="disabled" class="btn-decline">
                {{ isLoggedIn ? "Decline" : "Login to Decline" }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.invite-card {
    padding: 15px;
    border-radius: 8px;
    background: var(--bg-primary);

    .invite-info {
        display: grid;

        .invite-text {
            margin: 0;
        }

        .watchlist-name {
            margin: 0;
            color: var(--primary);
        }

        .invite-date {
            font-size: small;
            color: var(--text-secondary);
        }
    }

    .invite-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }

    button {
        padding: 8px 12px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-weight: bold;

        &.btn-accept {
            background-color: var(--ok);
        }

        &.btn-decline {
            background-color: var(--danger);
        }
    }
}

.invite-card.large {
    padding: 24px;
    border-width: 2px;

    .watchlist-name {
        font-size: 1.5rem;
    }

    .invite-actions {
        justify-content: center;
    }
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import { type Invite } from "../api";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";

const emits = defineEmits(["accept", "decline"]);
const props = defineProps<{ invite: Invite; size: "small" | "large"; disabled?: boolean; }>();

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const isLoggedIn = computed(() => !!authStore.token);
const isExpired = computed(() => new Date(props.invite.expiresAt) < new Date());

function formatDate(d: string) {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function handleAction(type: "accept" | "decline") {
    if (!isLoggedIn.value) {
        router.push({ name: "login", query: { redirect: route.fullPath } });
        return;
    }

    emits(type);
}
</script>
