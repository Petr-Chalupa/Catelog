export const useUserStore = defineStore(
    "user",
    () => {
        const { $api } = useNuxtApp();
        const session = useUserSession();
        const toasts = useToasts();

        // --- STATE ---
        const user = ref<UserPublic | null>(null);
        const isReady = ref(false);

        // --- ACTIONS ---
        const fetch = async () => {
            try {
                user.value = await $api<UserPublic>("/api/users/me", { method: "GET" });
            } catch (e) {
                toasts.error("Failed to fetch user", e);
            } finally {
                isReady.value = true;
            }
        };

        const clear = () => {
            user.value = null;
            isReady.value = false;

            useInvitesStore().clear();
            useWatchlistsStore().clear();
        };

        const signOut = async () => {
            try {
                await session.signOut({
                    onSuccess: () => {
                        clear();
                        navigateTo("/login");
                    },
                });
            } catch (e) {
                toasts.error("Failed to sign out", e);
            }
        };

        const deleteAccount = async () => {
            try {
                await $api("/api/users/me", { method: "DELETE" });
                await signOut();
            } catch (e) {
                toasts.error("Failed to delete account", e);
            }
        };

        return {
            user,
            isReady,
            fetch,
            signOut,
            deleteAccount,
            clear,
        };
    },
    {
        persist: {
            pick: ["user"],
            serializer: {
                serialize: JSON.stringify,
                deserialize: (value) => {
                    const parsed = JSON.parse(value);
                    const result = UserPublicSchema.safeParse(parsed.user);
                    return { user: result.success ? result.data : null };
                },
            },
        },
    },
);
