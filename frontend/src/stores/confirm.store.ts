import { defineStore } from "pinia";
import { ref } from "vue";

export const useConfirmStore = defineStore("confirm", () => {
    // --- STATE ---
    const isOpen = ref(false);
    const title = ref("");
    const message = ref("");
    let resolvePromise: ((value: boolean) => void) | null = null;

    // --- RESET ---
    function $reset() {
        isOpen.value = false;
        title.value = "";
        message.value = "";
        resolvePromise = null;
    }

    // --- ACTIONS ---
    async function ask(t: string, m: string): Promise<boolean> {
        title.value = t;
        message.value = m;
        isOpen.value = true;

        return new Promise<boolean>((res) => {
            resolvePromise = res;
        });
    }

    function confirm() {
        if (resolvePromise) resolvePromise(true);
        $reset();
    }

    function cancel() {
        if (resolvePromise) resolvePromise(false);
        $reset();
    }

    return {
        isOpen,
        title,
        message,
        $reset,
        ask,
        confirm,
        cancel,
    };
});
