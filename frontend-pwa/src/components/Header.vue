<template>
    <header class="header">
        <div class="header-left">
            <ArrowLeft v-if="!isMainRoute" @click="goBack" class="arrow-back" />
            <slot name="left"></slot>
        </div>

        <div class="header-center">
            <slot name="center"></slot>
        </div>

        <div class="header-right">
            <WifiOff v-if="!isOnline" class="offline" />
            <slot name="actions"></slot>
        </div>
    </header>
</template>

<style scoped>
.header {
    position: sticky;
    top: 0;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    height: 3.5rem;
    padding: 0 1rem;
    border-bottom: 1px solid var(--border);
    background-color: var(--bg-primary);
    z-index: 999;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-self: start;
}

.header-center {
    justify-self: center;
    font-weight: 600;
    font-size: 1.1rem;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-self: end;
}

.arrow-back {
    cursor: pointer;
}

.offline {
    color: var(--secondary);
}
</style>

<script setup lang="ts">
import { ArrowLeft, WifiOff } from "lucide-vue-next";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOnline } from "../composables/useOnline";

const router = useRouter();
const route = useRoute();
const isMainRoute = computed(() => route.name === "watchlists");
const isOnline = useOnline();

function goBack() {
    if (window.history.state?.back || route.query.overlay) {
        router.back();
    } else {
        router.push({ name: "watchlists" });
    }
};
</script>