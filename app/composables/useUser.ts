import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

export default function () {
    const { $api } = useNuxtApp();
    const queryClient = useQueryClient();
    const session = useUserSession();
    const toasts = useToasts();

    // --- QUERY ---
    const userQuery = useQuery({
        queryKey: ["user"],
        queryFn: () => $api<UserPublic>("/api/users/me", { method: "GET" }),
    });

    // --- SIGN OUT ---
    const signOut = useMutation({
        mutationFn: () => session.signOut(),

        onSuccess: async () => {
            queryClient.clear();
            navigateTo("/login");
        },

        onError: (_err) => {
            toasts.error("Failed to sign out", _err);
        },
    });

    // --- DELETE ACCOUNT ---
    const deleteAccount = useMutation({
        mutationFn: () => $api("/api/users/me", { method: "DELETE" }),

        onSuccess: () => {
            signOut.mutate();
        },

        onError: (_err) => {
            toasts.error("Failed to delete account", _err);
        },
    });

    return {
        user: userQuery.data,
        isLoading: userQuery.isLoading,
        isError: userQuery.isError,
        error: userQuery.error,
        refetch: userQuery.refetch,

        signOut: signOut.mutateAsync,
        isSigningOut: signOut.isPending,

        deleteAccount: deleteAccount.mutateAsync,
        isDeletingAccount: deleteAccount.isPending,
    };
}
