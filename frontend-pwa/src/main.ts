import { createApp } from "vue";
import { createPinia } from "pinia";
import { useAuthStore } from "./stores/auth";
import { OpenAPI } from "./api";
import App from "./App.vue";

// Initialize API
const authStore = useAuthStore();
OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL;
OpenAPI.TOKEN = authStore.token;

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
