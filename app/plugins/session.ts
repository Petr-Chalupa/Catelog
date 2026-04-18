export default defineNuxtPlugin(async () => {
    const { loggedIn } = useUserSession();
    const userStore = useUserStore();
    const invitesStore = useInvitesStore();
    const watchlistsStore = useWatchlistsStore();

    if (loggedIn.value) {
        await Promise.allSettled([userStore.fetch(), invitesStore.fetch(), watchlistsStore.fetch()]);
    }
});
