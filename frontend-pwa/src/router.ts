import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/auth.store";
import { useUserStore } from "./stores/user.store";
import { UserService } from "./api";
import Login from "./pages/Login.vue";
import Watchlists from "./pages/Watchlists.vue";
import Profile from "./pages/Profile.vue";
import Invite from "./pages/Invite.vue";

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            redirect: "/watchlists",
        },
        {
            path: "/login",
            name: "login",
            component: Login,
        },
        {
            path: "/login/callback",
            component: { render: () => null },
            beforeEnter: (to, from, next) => {
                const authStore = useAuthStore();
                const token = to.query.token as string;
                const redirectTo = to.query.redirect as string;
                if (token) {
                    authStore.setToken(token);
                    return next(redirectTo || "/");
                }
                next("/login");
            },
        },
        {
            path: "/watchlists",
            name: "watchlists",
            component: Watchlists,
            meta: { requiresAuth: true },
        },
        {
            path: "/watchlists/:listId",
            name: "watchlistDetails",
            component: { render: () => null },
            meta: { requiresAuth: true },
            props: true,
        },
        {
            path: "/watchlists/:listId/settings",
            name: "watchlistSettings",
            component: { render: () => null },
            meta: { requiresAuth: true },
            props: true,
        },
        {
            path: "/watchlists/:listId/items/:itemId",
            name: "watchlistItem",
            component: { render: () => null },
            meta: { requiresAuth: true },
            props: true,
        },
        {
            path: "/profile",
            name: "profile",
            component: Profile,
            meta: { requiresAuth: true },
        },
        {
            path: "/invites/:token",
            name: "invite",
            component: Invite,
        },
        {
            path: "/:pathMatch(.*)*",
            redirect: "/",
        },
    ],
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const userStore = useUserStore();

    if (to.meta.requiresAuth && !authStore.token) {
        return next({ name: "login", query: { redirect: to.fullPath } });
    }

    if (authStore.token && !userStore.profile?.id) {
        try {
            const user = await UserService.getUserMe();
            userStore.setProfile(user);
        } catch (error) {
            authStore.logout();
        }
    }
    next();
});
