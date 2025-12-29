<template>
    <draggable :model-value="items" @change="onDragChange" item-key="id" tag="div" :delay="300" :delay-on-touch-only="false" :touch-start-threshold="5" ghost-class="sortable-ghost" drag-class="sortable-drag" :animation="200" class="list-grid">
        <template #item="{ element, index }">
            <div class="list-row" @click="$emit('row-click', element)">
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
.list {
    display: grid;
    padding: 1rem;
}

.list-row {
    position: relative;
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem 0.75rem 0.75rem;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background-color 0.1s ease;
    user-select: none;

    &:hover {
        background-color: var(--bg-secondary);
        border-color: var(--primary);
    }

    &:hover::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--primary);
    }

    &:first-child {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;

        &:hover::before {
            border-top-left-radius: 4px;
        }
    }

    &:last-child {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;

        &:hover::before {
            border-bottom-left-radius: 4px;
        }
    }

    &:not(:last-child) {
        border-bottom: 1px solid var(--border);
    }
}

.ghost-item {
    opacity: 0.5;
    background: var(--bg-secondary);
    border: 1px dashed var(--primary);
    transform: scale(1.02);
}

.list-item {
    transition: transform 0.2s ease;
    user-select: none;
    -webkit-touch-callout: none;

    & :active {
        cursor: grabbing;
    }
}

.body {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 2rem;
}
</style>

<script setup lang="ts">
import draggable from "vuedraggable";

const emits = defineEmits(["row-click", "item-moved"]);
const props = defineProps<{ items: any[]; }>();

const onDragChange = (evt: any) => {
    if (evt.moved) {
        const updatedArray = [...props.items];
        const item = updatedArray.splice(evt.moved.oldIndex, 1)[0];
        updatedArray.splice(evt.moved.newIndex, 0, item);
        emits("item-moved", { element: evt.moved.element, newArray: updatedArray });
    }
};
</script>