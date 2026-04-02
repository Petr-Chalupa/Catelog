<template>
    <div class="range-input">
        <div class="range-header">
            <label class="range-label">
                {{ label }}
                <span v-if="unit" class="unit-tag">[{{ unit }}]</span>
            </label>
            <span class="range-current">{{ value }}</span>
        </div>

        <div class="slider-wrapper">
            <input type="range" :min="min" :max="max" :step="step ?? 1" v-model.number="value" />
            <div class="range-ticks">
                <span>{{ min }}</span>
                <span class="mid">{{ midpoint }}</span>
                <span>{{ max }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.range-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    margin-bottom: 0.75rem;

    .range-label {
        font-weight: 600;
        color: var(--text-secondary);

        .unit-tag {
            font-size: 0.75rem;
            font-weight: normal;
            margin-left: 4px;
        }
    }

    .range-current {
        font-family: monospace;
        font-weight: bold;
        color: var(--primary);
    }
}

.slider-wrapper {
    padding: 0 4px;

    input {
        width: 100%;
        height: 6px;
        background: var(--border);
        border-radius: 10px;
        appearance: none;
        outline: none;

        &::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: var(--primary);
            cursor: pointer;
            border: 3px solid var(--bg-secondary);
            box-shadow: 0 0 7px color-mix(in srgb, var(--primary), transparent 70%);
        }
    }

    .range-ticks {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 0.7rem;
        color: var(--text-secondary);
        position: relative;

        .mid {
            opacity: 0.9;
        }
    }
}
</style>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ label: string; min: number; max: number; step?: number; unit?: string; }>();
const value = defineModel<number>();

const midpoint = computed(() => Math.round((props.min + props.max) / 2));
</script>