export default defineNuxtPlugin(async () => {
    const { loggedIn } = useUserSession();
    const userStore = useUserStore();
    const invitesStore = useInvitesStore();
    const watchlistsStore = useWatchlistsStore();

    watch(
        loggedIn,
        async (isLoggedIn) => {
            if (isLoggedIn) {
                await Promise.allSettled([userStore.fetch(), invitesStore.fetch(), watchlistsStore.fetch()]);
            }
        },
        { immediate: true, once: true },
    );
});
