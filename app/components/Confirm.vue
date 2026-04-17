<template>
    <dialog ref="dialogRef" class="confirm-dialog" @close="cancel" @cancel.prevent="cancel">
        <div v-if="open" class="dialog-content">
            <h3>{{ title }}</h3>
            <p>{{ message }}</p>

            <div class="actions">
                <button @click="cancel" data-theme="primary">CANCEL</button>
                <button @click="accept" data-theme="danger">CONFIRM</button>
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
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
    }

    &[open] {
        animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
}

.dialog-content {
    padding: 24px;

    h3 {
        margin: 0;
        text-align: center;
    }

    p {
        margin: 1.5rem 0;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
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
const { open, title, message, accept, cancel, } = useConfirm();
const dialogRef = ref<HTMLDialogElement | null>(null);

watch(open, (isOpen) => {
    if (!dialogRef.value) return;

    if (isOpen) dialogRef.value.showModal();
    else dialogRef.value.close();
});
</script>