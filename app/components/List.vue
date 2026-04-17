<template>
    <draggable :model-value="items" :item-key="keyPath" tag="div" class="list-grid" :disabled="!isDraggable || !isOnline" :animation="200" :delay="300" :delay-on-touch-only="false"
        :touch-start-threshold="5" ghost-class="ghost-item" drag-class="drag-item" @change="onDragChange">
        <template #item="{ element, index }">
            <div class="list-row" :tabindex="0" @click="handleRowClick(element)" @keydown.enter="handleRowClick(element)" @keydown.space.prevent="handleRowClick(element)">
                <div class="body">
                    <slot name="body" :item="element" :index="index"></slot>
                </div>

                <div class="actions">
                    <slot name="actions" :item="element" :index="index"></slot>
                </div>
            </div>
        </template>
    </draggable>
</template>

<style scoped>
.list-grid {
    display: grid;
}

.list-row {
    position: relative;
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem 0.75rem 0.75rem;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background-color 0.1s ease;
    user-select: none;

    &:hover::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--primary);
    }

    &:last-child {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;

        &:hover::before {
            border-bottom-left-radius: 4px;
        }
    }
}

.body {
    user-select: none;
    -webkit-touch-callout: none;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 2rem;
}
</style>

<script setup lang="ts" generic="T">
import draggable from "vuedraggable";

const isOnline = useState<boolean>("is-online");

const props = withDefaults(
    defineProps<{ items: T[]; keyPath?: string; isDraggable?: boolean }>(),
    { keyPath: "_id", isDraggable: false }
);

const emit = defineEmits<{
    (e: "row-click", item: T): void
    (e: "item-moved", payload: { element: T; newIndex: number; }): void
}>();

function handleRowClick(item: T) {
    emit("row-click", item)
}

function onDragChange(e: any) {
    if (e.moved) {
        const { element, newIndex, oldIndex } = e.moved;
        emit("item-moved", { element, newIndex });
    }
}
</script>
