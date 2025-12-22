import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/auth";
import HomePage from "./pages/HomePage.vue";
import LoginPage from "./pages/LoginPage.vue";

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            component: HomePage,
            meta: { requiresAuth: true },
        },
        {
            path: "/login",
            component: LoginPage,
        },
        // {
        //     path: "/titles",
        //     component: TitlesPage,
        //     meta: { requiresAuth: true },
        // },
        // {
        //     path: "/watchlists",
        //     component: WatchlistsPage,
        //     meta: { requiresAuth: true },
        // },
    ],
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.token) {
        return next("/login");
    }

    next();
});
