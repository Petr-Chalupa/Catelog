export default defineNuxtConfig({
    future: {
        compatibilityVersion: 5,
    },
    experimental: { nitroAutoImports: true },
    compatibilityDate: "2025-07-15",
    devtools: false,
    modules: [
        "@pinia/nuxt",
        "pinia-plugin-persistedstate/nuxt",
        "@vite-pwa/nuxt",
        "@nuxt/icon",
        "@nuxtjs/color-mode",
        "@onmax/nuxt-better-auth",
    ],
    vite: {
        optimizeDeps: {
            include: ["fractional-indexing", "zod", "vuedraggable"],
        },
    },
    runtimeConfig: {
        MONGO_URI: "",
        MONGO_DB: "",
        BETTER_AUTH_SECRET: "",
        SYSTEM_MAINTENANCE_KEY: "",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
        MS_CLIENT_ID: "",
        MS_CLIENT_SECRET: "",
        TMDB_API_KEY: "",
        TMDB_BASE_URL: "",
        OMDB_API_KEY: "",
        OMDB_BASE_URL: "",
        VAPID_PRIVATE_KEY: "",
        VAPID_SUBJECT: "",
        public: {
            ENV: "",
            BETTER_AUTH_BASE_URL: "",
            VAPID_PUBLIC_KEY: "",
        },
    },
    routeRules: {
        "/app/**": { auth: { redirectTo: "/login" } },
    },
    app: {
        head: {
            title: "Catelog",
            htmlAttrs: {
                lang: "en",
            },
            meta: [
                { name: "description", content: "Catelog - When you like watching movies with your cat" },
                { name: "author", content: "Petr Chalupa" },
                { name: "theme-color", content: "#30a5ff" },
                { property: "og:type", content: "website" },
                { property: "og:url", content: "https://catelog.chalupapetr.cz" },
                { property: "og:title", content: "Catelog" },
                { property: "og:description", content: "When you like watching movies with your cat" },
                { property: "og:image", content: "https://catelog.chalupapetr.cz/pwa-192x192.png" },
            ],
            link: [
                { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
                { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "48x48" },
                { rel: "icon", type: "image/svg+xml", href: "/favicon.svg", sizes: "any" },
            ],
        },
    },
    pwa: {
        registerType: "autoUpdate",
        strategies: "injectManifest",
        srcDir: ".",
        filename: "sw.ts",
        manifest: {
            name: "Catelog",
            short_name: "Catelog",
            description: "When you like watching movies with your cat",
            lang: "en",
            start_url: "/app",
            display: "standalone",
            background_color: "#141414",
            theme_color: "#30a5ff",
            orientation: "portrait",
            icons: [
                { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
                { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
                { src: "/pwa-maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
                { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
            ],
        },
        injectManifest: {
            globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        },
    },
    piniaPluginPersistedstate: {
        storage: "localStorage",
        key: "Catelog-%id",
    },
});
