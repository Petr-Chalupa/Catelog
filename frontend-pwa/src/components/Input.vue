<template>
    <div class="wrapper">
        <input v-model="value" v-bind="$attrs" @keyup.enter="$emit('enter')" />
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
    transition: all 0.2s;

    &:hover:not(:disabled) {
        color: var(--primary-hover);
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}
</style>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
const value = defineModel<string>({ default: "" });
const emit = defineEmits(["enter"]);
</script>