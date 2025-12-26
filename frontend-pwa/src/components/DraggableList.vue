<template>
    <draggable :model-value="items" @change="onDragChange" item-key="id" tag="div" handle=".drag-handle" ghost-class="sortable-ghost" drag-class="sortable-drag" :animation="200" class="list-grid">
        <template #item="{ element, index }">
            <div class="list-row" @click="$emit('row-click', element)">
                <div class="left">
                    <div class="drag-handle">
                        <GripVertical :size="18" />
                    </div>
                    <div class="body">
                        <h3>{{ element[titleKey] }}</h3>
                        <div class="meta">
                            <slot name="meta" :item="element" :index="index"></slot>
                        </div>
                    </div>
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
    gap: 2rem;
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

.left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;

    .drag-handle {
        display: flex;
        align-items: center;
        min-height: 2rem;
    }
}

.body {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 2rem;

    h3 {
        flex: 1;
        font-size: 1rem;
        font-weight: 400;
        color: var(--text-primary);
    }

    .meta {
        display: flex;
        gap: 1rem;
        color: var(--text-secondary);
    }
}
</style>

<script setup lang="ts">
import draggable from "vuedraggable";
import { GripVertical } from "lucide-vue-next";

const emits = defineEmits(["row-click", "item-moved"]);
const props = defineProps<{ items: any[]; titleKey: string; }>();

const onDragChange = (evt: any) => {
    if (evt.moved) {
        const updatedArray = [...props.items];
        const item = updatedArray.splice(evt.moved.oldIndex, 1)[0];
        updatedArray.splice(evt.moved.newIndex, 0, item);
        emits("item-moved", { element: evt.moved.element, newArray: updatedArray });
    }
};
</script>