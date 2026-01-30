import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { router } from "./router";
import { i18n } from "./i18n";
import { initAPI } from "./api/api";
import App from "./App.vue";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(i18n);
app.directive("onlineonly", {
    mounted(el) {
        el._onlineHandler = () => {
            const isOffline = !navigator.onLine;
            el.style.opacity = isOffline ? "0.5" : "";
            el.style.pointerEvents = isOffline ? "none" : "";
            el.setAttribute("disabled", isOffline ? "true" : "false");
        };
        window.addEventListener("online", el._onlineHandler);
        window.addEventListener("offline", el._onlineHandler);
        el._onlineHandler();
    },
    unmounted(el) {
        window.removeEventListener("online", el._onlineHandler);
        window.removeEventListener("offline", el._onlineHandler);
    },
});
app.mount("#app");

initAPI();
