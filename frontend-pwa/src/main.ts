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
        const apply = () => {
            if (!navigator.onLine) {
                el.setAttribute("disabled", "true");
                el.style.pointerEvents = "none";
                el.style.opacity = "0.6";
                el.title = "Offline - changes disabled";
            } else {
                el.removeAttribute("disabled");
                el.style.pointerEvents = "";
                el.style.opacity = "";
                el.removeAttribute("title");
            }
        };

        apply();

        window.addEventListener("offline", apply);
        window.addEventListener("online", apply);
    },
});
app.mount("#app");

initAPI();
