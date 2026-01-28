<template>
    <div class="wrapper">
        <input v-model="value" @focus="isFocused = true" @blur="isFocused = false" @keyup.enter="$emit('enter')" :placeholder="placeholder" />
        <div class="actions">
            <slot name="actions"></slot>
        </div>
    </div>
</template>

<style scoped>
.wrapper {
    display: flex;
    align-items: center;
    background: var(--bg-primary);
    border-radius: 10px;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    gap: 0.5rem;

    input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--text-primary);
        font-size: 0.9rem;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
    }
}
</style>

<style>
.wrapper .actions>button {
    display: flex;
    align-items: center;
    background: transparent;
    padding: 0;
    border: none;
    color: var(--primary);
    cursor: pointer;
    transition:
        transform 0.2s,
        background 0.2s;

    &:hover:not(:disabled) {
        background: var(--primary-dark);
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}
</style>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = defineProps<{ placeholder?: string; autoFocus?: boolean }>();
const value = defineModel<string>({ default: "" });
const emit = defineEmits(["enter"]);

const inputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);

onMounted(() => { if (props.autoFocus) inputRef.value?.focus(); });
</script>