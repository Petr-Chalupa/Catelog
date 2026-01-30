<template>
    <div class="triage-group">
        <div v-for="item in items" :key="getItemKey(item)" class="triage-item" :class="[`${getState(item)}`]" @click="cycle(item)">
            <span class="dot"></span>
            <span class="body">
                <slot name="body" :item="item" :state="getState(item)" :index="getStateIndex(item)">{{ item }}</slot>
            </span>
            <slot name="icon" :item="item" :state="getState(item)" :index="getStateIndex(item)"></slot>
        </div>
    </div>
</template>

<style scoped>
.triage-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.triage-item {
    --triage-color: var(--text-secondary);

    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid color-mix(in srgb, var(--triage-color), transparent 50%);
    background-color: color-mix(in srgb, var(--triage-color), transparent 75%);
    color: var(--triage-color);
    filter: contrast(1.5);
    padding: 4px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: color-mix(in srgb, currentColor, transparent 25%);
    }

    &.positive {
        --triage-color: var(--ok);
    }

    &.negative {
        --triage-color: var(--danger);

        .body {
            text-decoration: line-through;
        }
    }
}
</style>

<script setup lang="ts">
interface Props {
    items: any[];
    itemKey?: string;
    states?: string[];
}

const props = withDefaults(defineProps<Props>(), {
    states: () => ["neutral", "positive", "negative"],
    itemKey: undefined,
});
const stateValues = defineModel<Record<string, string>>({ default: () => ({}) });

const getItemKey = (item: any) => props.itemKey ? item[props.itemKey] : item;
const getState = (item: any) => stateValues.value[getItemKey(item)] || props.states[0];
const getStateIndex = (item: any) => props.states.indexOf(getState(item)!);

function cycle(item: any) {
    const key = getItemKey(item);
    const current = getState(item);
    const nextIdx = (props.states.indexOf(current!) + 1) % props.states.length;
    stateValues.value = { ...stateValues.value, [key]: props.states[nextIdx] };
} 
</script>
