import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { router } from "./router";
import { i18n } from "./i18n";
import { initAPI } from "./api/api";
import { vOnlineOnly } from "./utils/online";
import App from "./App.vue";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(i18n);
app.directive("onlineonly", vOnlineOnly);
app.mount("#app");

initAPI();
