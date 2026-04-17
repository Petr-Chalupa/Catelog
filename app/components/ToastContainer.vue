<template>
    <div class="toast-container">
        <TransitionGroup name="toast-list">
            <div v-for="toast in toasts" :key="toast.id" class="toast-item" :class="toast.type" @click="removeToast(toast.id)">
                <div class="toast-content">{{ toast.message }}</div>
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
    min-width: 10rem;
    max-width: 20rem;
    padding: 1rem;
    border-radius: 0.5rem;
    background: var(--bg-secondary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    border-left: 6px solid var(--border);

    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    &.error {
        border-left-color: var(--error);
        color: var(--error);
    }

    &.warn {
        border-left-color: var(--warn);
        color: var(--warn);
    }

    &.success {
        border-left-color: var(--ok);
        color: var(--ok);
    }

    &.info {
        border-left-color: var(--info);
        color: var(--info);
    }

    &:hover {
        filter: brightness(0.85);
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
const { toasts, removeToast } = useToasts();
</script>
