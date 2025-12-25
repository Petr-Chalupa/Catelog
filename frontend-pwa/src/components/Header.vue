<template>
    <header class="header">
        <ArrowLeft v-if="!isMainRoute" @click="goBack" class="arrow-back" />

        <slot></slot>

        <span class="offline">
            <WifiOff v-if="!isOnline" />
        </span>
    </header>
</template>

<style scoped>
.header {
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 3rem;
    padding: .5rem;
    border-bottom: 1px solid var(--border);
    background-color: var(--bg-primary);
}

.arrow-back {
    cursor: pointer;
}

.offline {
    display: flex;
    align-items: center;
    width: 1.5rem;
    color: var(--secondary);
}
</style>

<script setup lang="ts">
import { ArrowLeft, WifiOff } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOnline } from '../composables/useOnline';

const router = useRouter();
const route = useRoute();
const isMainRoute = computed(() => route.name === "watchlists");
const isOnline = useOnline();

function goBack() {
    if (window.history.state && window.history.state.back) {
        router.back();
    } else {
        router.push({ name: "watchlists" });
    }
};
</script>