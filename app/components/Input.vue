<template>
    <div class="wrapper">
        <input v-model="value" type="text" name="input" v-bind="$attrs" @keyup.enter="emit('enter', value)" />
        <div class="actions">
            <button v-for="action in actions" :key="action.icon" @click="action.cb(value)" :data-theme="action.theme">
                <Icon :name="action.icon" :size="25" />
            </button>
        </div>
    </div>
</template>

<style scoped>
.wrapper {
    display: flex;

    input {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }
}

.actions {
    display: flex;

    button {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.5rem;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;

        &:not(:last-child) {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }
    }
}
</style>

<script setup lang="ts">
const { actions = [] } = defineProps<{
    actions?: { icon: string; theme?: string; cb: (val: string) => void }[]
}>();

const value = defineModel<string>({ default: "" });

const emit = defineEmits(["enter"]);
</script>