import z from "zod";

export const useInvitesStore = defineStore(
    "invites",
    () => {
        const { $api } = useNuxtApp();
        const { user } = useUserSession();
        const toasts = useToasts();

        // --- STATE ---
        const invites = ref<InvitePublic[]>([]);
        const isReady = ref(false);

        // --- ACTIONS: USER ---
        const fetch = async () => {
            try {
                invites.value = await $api<InvitePublic[]>("/api/invites", {
                    method: "GET",
                    query: { type: "incoming" },
                });
            } catch (e) {
                toasts.error("Failed to fetch incoming invites", e);
            } finally {
                isReady.value = true;
            }
        };

        const clear = () => {
            invites.value = [];
            isReady.value = false;
        };

        const acceptInvite = async (inviteId: string) => {
            const originalInvites = [...invites.value];
            invites.value = invites.value.filter((i) => i._id !== inviteId);

            try {
                await $api(`/api/invites/${inviteId}/accept`, { method: "POST" });
            } catch (e) {
                invites.value = originalInvites;
                toasts.error("Failed to accept invite", e);
            }
        };

        const declineInvite = async (inviteId: string) => {
            const originalInvites = [...invites.value];
            invites.value = invites.value.filter((i) => i._id !== inviteId);

            try {
                await $api(`/api/invites/${inviteId}/decline`, { method: "DELETE" });
            } catch (e) {
                invites.value = originalInvites;
                toasts.error("Failed to decline invite", e);
            }
        };

        // --- ACTIONS: LISTS ---
        const sendInvite = async (listId: string, email: string) => {
            try {
                const { _id } = await $api<UserPublic>("/api/users", { method: "GET", query: { email } as UserQuery });
                await $api<InvitePublic>(`/api/invites`, {
                    method: "POST",
                    body: { listId, inviteeId: _id, inviterId: user.value?.id } as InviteCreate,
                });
            } catch (e) {
                toasts.error("Failed to send invite", e);
            }
        };

        return {
            invites,
            isReady,
            fetch,
            clear,
            acceptInvite,
            declineInvite,
            sendInvite,
        };
    },
    {
        persist: {
            pick: ["invites"],
            serializer: {
                serialize: (value) => JSON.stringify(value),
                deserialize: (value) => {
                    const parsed = JSON.parse(value);
                    const result = z.array(InvitePublicSchema).safeParse(parsed.invites);
                    return { invites: result.success ? result.data : [] };
                },
            },
        },
    },
);
