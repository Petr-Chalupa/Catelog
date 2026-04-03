import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_BASE_URL + "/auth",
});

export const { useSession } = authClient;
