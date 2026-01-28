<template>
    <Transition name="fade">
        <div v-if="isOpen" class="overlay" @keydown.esc="close">
            <div class="header">
                <slot name="header"></slot>
            </div>
            <div class="content">
                <slot name="body"></slot>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.overlay {
    position: fixed;
    top: 3.5rem;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-primary);
    z-index: 200;
    display: flex;
    flex-direction: column;
}

.header {
    padding: 1rem;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
}

.content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 2rem;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";

const isOpen = defineModel<boolean>({ default: false });
const props = defineProps<{ historyKey?: string }>();
const emit = defineEmits(["close"]);

function close() {
    isOpen.value = false;
    emit("close");
}

watch(isOpen, (newVal) => {
    if (newVal && props.historyKey) window.history.pushState({ mode: props.historyKey }, "");
});

onMounted(() => window.addEventListener("popstate", close));
onUnmounted(() => window.removeEventListener("popstate", close));
</script>