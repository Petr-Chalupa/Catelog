<template>
    <Transition name="fade">
        <div v-if="isOpen" class="overlay">
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
    padding-bottom: 1rem;
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
import { useRoute, useRouter } from "vue-router";

const isOpen = defineModel<boolean>({ default: false });
const props = defineProps<{ historyKey: string }>();
const emit = defineEmits(["close"]);

const route = useRoute();
const router = useRouter();

function close() {
    isOpen.value = false;
    emit("close");
}

function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && isOpen.value) close();
}

watch(isOpen, (newVal) => {
    const hasQuery = route.query[props.historyKey] === "open";

    if (newVal && !hasQuery) {
        router.push({ query: { ...route.query, [props.historyKey]: "open" } });
    } else if (!newVal && hasQuery) {
        router.back();
    }
});

onMounted(() => {
    window.addEventListener("popstate", close);
    window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener("popstate", close);
    window.removeEventListener("keydown", handleKeydown);
});
</script>