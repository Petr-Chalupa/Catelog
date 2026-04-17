<template>
    <button class="watched-btn" :class="item.state" @click.stop="handleClick" v-online-only>
        <Icon name="lucide:play" v-if="item.state === 'started'" :size="18" />
        <Icon name="lucide:check" v-else-if="item.state === 'finished'" :size="18" />
    </button>
</template>

<style scoped>
.watched-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    aspect-ratio: 1;
    background: transparent;
    border: 2px solid var(--text-secondary);
    border-radius: 50%;
    padding: 0;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &.started {
        background: var(--secondary);
        border-color: var(--secondary);
        box-shadow: 0 0 7px color-mix(in srgb, var(--secondary), transparent 50%);
    }

    &.finished {
        background: var(--primary);
        border-color: var(--primary);
        box-shadow: 0 0 7px color-mix(in srgb, var(--primary), transparent 50%);
    }

    &:active {
        transform: scale(0.9);
    }
}
</style>

<script setup lang="ts">
import planned from "~/assets/sounds/planned.mp3";
import started from "~/assets/sounds/started.mp3";
import finished from "~/assets/sounds/finished.mp3";

const soundMap: Record<WatchlistItemPublic["state"], string> = { planned, started, finished };

const { updateItem } = useWatchlistsStore();

const props = defineProps<{ listId: string; item: WatchlistItemPublic }>();

const emit = defineEmits<{
    (e: "click", item: WatchlistItemPublic): void
}>();

async function handleClick() {
    const options = WatchStateSchema.options;
    const currentIndex = options.indexOf(props.item.state);
    const nextIndex = (currentIndex + 1) % options.length;
    const newState = options[nextIndex]!

    const audio = new Audio(soundMap[newState]);
    audio.volume = 0.4;
    audio.play().catch(() => { /* Silent fail */ });

    await updateItem(props.listId, props.item._id, { state: newState });

    emit("click", props.item);
}
</script>