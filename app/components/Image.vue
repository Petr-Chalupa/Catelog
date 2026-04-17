<template>
    <div class="image" :class="{ 'error': isFallback }">
        <img v-if="!isFallback" ref="imgRef" :src="src" loading="lazy" @error="error = true" />
        <Icon v-else :name="fallback ?? 'lucide:image'" class="fallback-icon" />
    </div>
</template>

<style scoped>
.image {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--bg-secondary);

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .fallback-icon {
        width: inherit;
        height: inherit;
        color: var(--text-secondary);
    }
}
</style>

<script setup lang="ts">
const props = defineProps<{
    src?: string;
    fallback?: string;
}>();

const error = ref(false);
const imgRef = ref<HTMLImageElement | null>(null);

const isFallback = computed(() => {
    if (!props.src || error.value) return true;

    if (imgRef.value?.complete && imgRef.value.naturalWidth === 0) {
        return true;
    }

    return false;
});

watch(() => props.src, () => {
    error.value = false;
});
</script>