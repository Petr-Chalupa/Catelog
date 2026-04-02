import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "./stores/user.store";
import Login from "./pages/Login.vue";
import Watchlists from "./pages/WatchLists.vue";
import WatchlistDetail from "./pages/WatchlistDetail.vue";
import WatchlistSettings from "./pages/WatchlistSettings.vue";
import WatchlistItem from "./pages/WatchlistItem.vue";
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
            path: "/watchlists",
            name: "watchlists",
            component: Watchlists,
            meta: { requiresAuth: true },
        },
        {
            path: "/watchlists/:listId",
            name: "watchlistDetails",
            component: WatchlistDetail,
            meta: { requiresAuth: true },
            props: true,
        },
        {
            path: "/watchlists/:listId/settings",
            name: "watchlistSettings",
            component: WatchlistSettings,
            meta: { requiresAuth: true },
            props: true,
        },
        {
            path: "/watchlists/:listId/items/:itemId",
            name: "watchlistItem",
            component: WatchlistItem,
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

router.beforeEach(async (to, from) => {
    const userStore = useUserStore();

    while (userStore.isAuthLoading) {
        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (to.meta.requiresAuth && !userStore.isAuthenticated) {
        return { name: "login", query: { redirect: to.fullPath } };
    }

    if (userStore.isAuthenticated && !userStore.profile?.id) {
        try {
            await userStore.fetchProfile();
        } catch (error) {
            await userStore.logout();
        }
    }
});
