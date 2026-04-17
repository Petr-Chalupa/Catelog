<template>
    <header class="header">
        <div class="header-left">
            <Icon name="lucide:arrow-left" v-if="!isMainRoute" :size="25" @click="goBack" class="arrow-back" />
            <slot name="left"></slot>
        </div>

        <div class="header-center">
            <slot name="center"></slot>
        </div>

        <div class="header-right">
            <Icon name="lucide:wifi-off" v-show="!isOnline" :size="25" class="offline" />
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
    gap: 0.5rem;
    align-items: center;
    height: var(--header-height);
    padding: 0 0.75rem;
    border-bottom: 1px solid var(--border);
    background-color: var(--bg-primary);
    z-index: 999;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    justify-self: start;

    .arrow-back {
        cursor: pointer;
        transition: opacity 0.2s;
        padding: 4px;

        &:hover {
            opacity: 0.7;
        }
    }
}

.header-center {
    font-weight: 600;
    font-size: 1.1rem;
    text-align: center;
    display: inline-block;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-self: end;

    .offline {
        color: var(--danger);
    }
}
</style>

<style>
.header-right>*:not(.offline) {
    cursor: pointer;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        opacity: 0.7;
    }
}
</style>

<script setup lang="ts">
const route = useRoute();
const isMainRoute = computed(() => route.name === "app");
const isOnline = useState<boolean>("is-online");

function goBack() {
    const segments = route.path.split("/").filter(Boolean);
    segments.pop();
    navigateTo("/" + segments.join("/"));
}
</script>
