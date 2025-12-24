<template>
    <header class="header">
        <ArrowLeft v-if="!isMainRoute" @click="router.back" />

        <slot></slot>

        <span class="offline">
            <WifiOff v-if="!isOnline" />
        </span>
    </header>
</template>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 3rem;
    padding: .5rem;
    border-bottom: 1px solid var(--border);
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
</script>