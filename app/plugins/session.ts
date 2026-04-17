export default defineNuxtPlugin(() => {
    const { loggedIn } = useUserSession();
    const userStore = useUserStore();
    const invitesStore = useInvitesStore();
    const watchlistsStore = useWatchlistsStore();

    callOnce(async () => {
        if (!loggedIn.value) return;

        await Promise.allSettled([userStore.fetch(), invitesStore.fetch(), watchlistsStore.fetch()]);
    });
});
