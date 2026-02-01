<template>
    <dialog ref="dialogRef" class="confirm-dialog" @close="confirmStore.cancel">
        <div v-if="confirmStore.isOpen" class="dialog-content">
            <h3>{{ confirmStore.title }}</h3>
            <p>{{ confirmStore.message }}</p>
            <div class="actions">
                <button @click="confirmStore.cancel" class="btn-cancel">Zrušit</button>
                <button @click="confirmStore.confirm" class="btn-confirm">Potvrdit</button>
            </div>
        </div>
    </dialog>
</template>

<style scoped>
.confirm-dialog {
    border: 1px solid var(--border);
    border-radius: 12px;
    outline: none;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    padding: 0;
    width: 90%;
    max-width: 400px;

    &::backdrop {
        background-color: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
    }

    &[open] {
        animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
}

.dialog-content {
    padding: 1.5rem;

    h3 {
        margin-top: 0;
        margin-bottom: 0.75rem;
        font-size: 1.25rem;
        font-weight: 600;
    }

    p {
        color: var(--text-secondary);
        margin-bottom: 2rem;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;

        button {
            padding: 0.625rem 1.25rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
        }

        .btn-cancel {
            background-color: transparent;
            color: var(--text-primary);
            border-color: var(--border);

            &:hover {
                background-color: var(--bg-primary);
            }
        }

        .btn-confirm {
            background-color: var(--secondary);

            &:hover {
                background-color: var(--secondary-hover);
            }
        }
    }
}

@keyframes zoom {
    from {
        transform: scale(0.95);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}
</style>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfirmStore } from "../stores/confirm.store";

const confirmStore = useConfirmStore();
const dialogRef = ref<HTMLDialogElement | null>(null);

watch(() => confirmStore.isOpen, (next) => {
    if (next) dialogRef.value?.showModal();
    else dialogRef.value?.close();
});
</script>