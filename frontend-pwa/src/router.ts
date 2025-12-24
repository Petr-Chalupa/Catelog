import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/auth.store";
import { useUserStore } from "./stores/user.store";
import { UserService } from "./api";
import Login from "./pages/Login.vue";
import Watchlists from "./pages/Watchlists.vue";

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            redirect: "/watchlists",
        },
        {
            path: "/login",
            component: Login,
        },
        {
            path: "/login/callback",
            component: { render: () => null },
            beforeEnter: (to, from, next) => {
                const authStore = useAuthStore();
                const token = to.query.token as string;
                if (token) {
                    authStore.setToken(token);
                    return next("/");
                }
                next("/login");
            },
        },
        {
            path: "/watchlists",
            component: Watchlists,
            meta: { requiresAuth: true },
        },
        {
            path: "/watchlists/:listId",
            component: { render: () => null },
            meta: { requiresAuth: true },
            props: true,
        },
        {
            path: "/watchlists/:listId/settings",
            component: { render: () => null },
            meta: { requiresAuth: true },
            props: true,
        },
        {
            path: "/watchlists/:listId/items/:itemId",
            component: { render: () => null },
            meta: { requiresAuth: true },
            props: true,
        },
        {
            path: "/profile",
            component: { render: () => null },
            meta: { requiresAuth: true },
        },
        {
            path: "/invites/:token",
            component: { render: () => null },
            meta: { requiresAuth: true },
        },
    ],
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const userStore = useUserStore();

    if (to.meta.requiresAuth && !authStore.token) {
        return next("/login");
    }

    if (authStore.token && (!userStore.profile || !userStore.profile.id)) {
        const user = await UserService.getUserMe();
        userStore.setProfile(user);
    }

    next();
});
