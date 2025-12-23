import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                name: "Catelog",
                short_name: "Catelog",
                start_url: "/",
                display: "standalone",
                background_color: "#ffffff",
                theme_color: "#42b983",
            },
        }),
    ],
    server: {
        port: 5000,
    },
});
