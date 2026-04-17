<template>
    <div class="range-input">
        <div class="range-header">
            <label class="range-label">
                {{ label }}
                <span v-if="unit" class="unit-tag">[{{ unit }}]</span>
            </label>
            <span class="range-current">{{ modelValue }}</span>
        </div>

        <div class="slider-wrapper">
            <input type="range" :min="min" :max="max" :step="step" v-model.number="modelValue" tabindex="0" />
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
    align-items: end;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;

    .range-label {
        font-weight: 600;

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
        height: 6px;
        padding: 0;
        margin: 0;
        outline: none;

        &::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--primary);
            cursor: pointer;
            outline: 3px solid var(--bg-secondary);
            box-shadow: 0 0 10px color-mix(in srgb, var(--primary), transparent 70%);
        }
    }

    .range-ticks {
        position: relative;
        margin-top: 8px;
        font-size: 0.7rem;
        height: 0.8rem;
        color: var(--text-secondary);

        span:first-child {
            position: absolute;
            left: 0;
        }

        span:last-child {
            position: absolute;
            right: 0;
        }

        .mid {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0.9;
        }
    }
}
</style>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    label: string;
    min: number;
    max: number;
    step?: number;
    unit?: string;
}>(), {
    step: 1
});

const modelValue = defineModel<number>({ default: 0 });

const midpoint = computed(() => Math.round((props.min + props.max) / 2));
</script>
