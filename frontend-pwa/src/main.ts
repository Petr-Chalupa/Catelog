import { createApp } from "vue";
import { createPinia } from "pinia";
import { router } from "./router";
import { useAuthStore } from "./stores/auth";
import { OpenAPI } from "./api";
import App from "./App.vue";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");

// Initialize API
const authStore = useAuthStore();
OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL;
OpenAPI.TOKEN = authStore.token;
