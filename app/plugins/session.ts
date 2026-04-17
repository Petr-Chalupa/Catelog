export default defineNuxtPlugin(async () => {
    const { loggedIn } = useUserSession();
    const userStore = useUserStore();
    const invitesStore = useInvitesStore();
    const watchlistsStore = useWatchlistsStore();
    console.log("--- OUSIDE RUN ---");

    await callOnce(async () => {
        console.log("--- IS LOGGED IN? ---");
        if (!loggedIn.value) return;
        console.log("--- STARTING STORE FETCH ---");

        await Promise.allSettled([userStore.fetch(), invitesStore.fetch(), watchlistsStore.fetch()]);
        console.log("--- FETCH COMPLETE ---");
    });
});
