import { ref, onMounted, onUnmounted, type Directive, watchEffect } from "vue";

const isOnline = ref(navigator.onLine);

const update = () => (isOnline.value = navigator.onLine);

export function useOnline() {
    onMounted(() => {
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
    });

    onUnmounted(() => {
        window.removeEventListener("online", update);
        window.removeEventListener("offline", update);
    });

    return isOnline;
}

export const vOnlineOnly: Directive = {
    mounted(el: HTMLElement) {
        const watcher = watchEffect(() => el.classList.toggle("is-offline", !isOnline.value));
        (el as any)._watcher = watcher;
    },
    unmounted(el: any) {
        el._watcher?.();
    },
};
