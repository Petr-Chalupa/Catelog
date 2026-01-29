<template>
    <div class="triage-group">
        <div v-for="item in items" :key="getItemKey(item)" class="triage-item" :class="[`${getState(item)}`]" :style="getItemStyle(getState(item)!)" @click="cycle(item)">
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
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--border);
    background-color: color-mix(in srgb, var(--triage-color), transparent 85%);
    color: var(--triage-color);
    padding: 4px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #666;
    }

    &.positive {
        background: color-mix(in srgb, var(--ok), black 80%);
        border-color: var(--ok);
        color: var(--ok);

        .dot {
            background: var(--ok);
        }
    }

    &.negative {
        background: color-mix(in srgb, var(--danger), black 80%);
        border-color: var(--danger);
        color: var(--danger);

        .body {
            text-decoration: line-through;
        }

        .dot {
            background: var(--danger);
        }
    }
}
</style>

<script setup lang="ts">
interface Props {
    items: any[];
    itemKey?: string;
    states?: string[];
    colors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
    states: () => ["neutral", "positive", "negative"],
    itemKey: undefined,
    colors: () => ["white", "green", "red"]
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

function getItemStyle(state: string) {
    const index = props.states.indexOf(state);
    const color = props.colors[index] || props.colors[0];
    return { "--triage-color": color };
}
</script>
