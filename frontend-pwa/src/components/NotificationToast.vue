<template>
    <div class="toast-container">
        <TransitionGroup name="toast-list">
            <div v-for="note in notificationStore.notifications" :key="note.id" class="toast-item" :class="note.type" @click="notificationStore.removeNotification(note.id)">
                <div class="toast-content">
                    <span class="message">{{ note.message }}</span>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<style scoped>
.toast-container {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
}

.toast-item {
    pointer-events: auto;
    max-width: 20rem;
    padding: 1rem;
    border-radius: 0.5rem;
    background: var(--bg-secondary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    border-left: 6px solid var(--border);

    &.error {
        border-left-color: var(--danger);
    }

    &.success {
        border-left-color: var(--ok);
    }

    &.info {
        border-left-color: var(--primary);
    }

    .close-btn {
        background: none;
        border: none;
    }
}

.toast-list-enter-active,
.toast-list-leave-active {
    transition: all 0.3s ease;
}

.toast-list-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.toast-list-leave-to {
    opacity: 0;
    transform: scale(0.9);
}
</style>

<script setup lang="ts">
import { useNotificationStore } from "../stores/notification.store";

const notificationStore = useNotificationStore();
</script>