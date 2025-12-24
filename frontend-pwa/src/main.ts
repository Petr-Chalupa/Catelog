import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import { router } from "./router";
import { initAPI } from "./api/api";
import App from "./App.vue";

const app = createApp(App);
app.use(createPinia());
app.use(
    createI18n({ legacy: false, locale: navigator.language.split("-")[0] || "en", fallbackLocale: "en", messages: {} })
);
app.use(router);
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
