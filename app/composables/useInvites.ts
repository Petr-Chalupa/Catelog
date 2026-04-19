import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

export default function () {
    const { $api, $queryKeys } = useNuxtApp();
    const { invitesKeys, watchlistsKeys } = $queryKeys;
    const queryClient = useQueryClient();
    const { user } = useUserSession();
    const toasts = useToasts();

    // --- QUERY ---
    const invitesQuery = useQuery({
        queryKey: invitesKeys.incoming(),
        queryFn: () => $api<InvitePublic[]>("/api/invites", { method: "GET", query: { type: "incoming" } }),
    });

    // --- ACCEPT ---
    const acceptInvite = useMutation({
        mutationFn: (inviteId: string) => $api(`/api/invites/${inviteId}/accept`, { method: "POST" }),

        onMutate: async (inviteId) => {
            await queryClient.cancelQueries({ queryKey: invitesKeys.incoming(), exact: true });

            const previous = queryClient.getQueryData<InvitePublic[]>(invitesKeys.incoming());
            queryClient.setQueryData(invitesKeys.incoming(), (old: InvitePublic[] = []) =>
                old.filter((i) => i._id !== inviteId),
            );

            return { previous };
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: watchlistsKeys.all });
        },

        onError: (_err, _inviteId, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(invitesKeys.incoming(), ctx.previous);
            }
            toasts.error("Failed to accept invite", _err);
        },
    });

    // --- DECLINE ---
    const declineInvite = useMutation({
        mutationFn: (inviteId: string) => $api(`/api/invites/${inviteId}/decline`, { method: "DELETE" }),

        onMutate: async (inviteId) => {
            await queryClient.cancelQueries({ queryKey: invitesKeys.incoming(), exact: true });

            const previous = queryClient.getQueryData<InvitePublic[]>(invitesKeys.incoming());
            queryClient.setQueryData(invitesKeys.incoming(), (old: InvitePublic[] = []) =>
                old.filter((i) => i._id !== inviteId),
            );

            return { previous };
        },

        onError: (_err, _inviteId, ctx) => {
            if (ctx?.previous) {
                queryClient.setQueryData(invitesKeys.incoming(), ctx.previous);
            }
            toasts.error("Failed to decline invite", _err);
        },
    });

    // --- SEND ---
    const sendInvite = useMutation({
        mutationFn: async ({ listId, email }: { listId: string; email: string }) => {
            const { _id } = await $api<UserPublic>("/api/users", { query: { email } as UserQuery });

            return $api("/api/invites", {
                method: "POST",
                body: { listId, inviteeId: _id, inviterId: user.value?.id } as InviteCreate,
            });
        },

        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: invitesKeys.all, exact: false });
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: watchlistsKeys.all });
        },

        onError: (_err) => {
            toasts.error("Failed to send invite", _err);
        },
    });

    return {
        invites: invitesQuery.data,
        isLoading: invitesQuery.isLoading,
        isError: invitesQuery.isError,
        error: invitesQuery.error,
        refetch: invitesQuery.refetch,

        acceptInvite: acceptInvite.mutateAsync,
        isAcceptingInvite: acceptInvite.isPending,

        declineInvite: declineInvite.mutateAsync,
        isDecliningInvite: declineInvite.isPending,

        sendInvite: sendInvite.mutateAsync,
        isSendingInvite: sendInvite.isPending,
    };
}
