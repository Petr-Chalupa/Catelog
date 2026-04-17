import type { Directive } from "vue";

export const vOnlineOnly: Directive<HTMLElement> = {
    mounted(el) {
        const isOnline = useState<boolean>("is-online");

        const apply = (online: boolean) => el.classList.toggle("is-offline", !online);
        const stop = watch(isOnline, apply);

        apply(isOnline.value);
        (el as any)._cleanup = stop;
    },

    unmounted(el) {
        (el as any)._cleanup?.();
    },
};

export default defineNuxtPlugin((nuxtApp) => {
    const isOnline = useState<boolean>("is-online", () => true);

    if (import.meta.client) {
        const update = () => (isOnline.value = navigator.onLine);
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        update();
    }

    nuxtApp.vueApp.directive("online-only", vOnlineOnly);
});
