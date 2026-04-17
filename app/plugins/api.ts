export default defineNuxtPlugin((nuxtApp) => {
    const api = $fetch.create({
        onRequest({ options }) {
            if (import.meta.server) {
                const headers = useRequestHeaders(["cookie"]) as HeadersInit;
                options.headers = {
                    ...headers,
                    ...options.headers,
                };
            }
        },
        async onResponseError({ response }) {
            if (response.status === 401) {
                await nuxtApp.runWithContext(() => navigateTo("/login"));
            }
        },
    });

    return {
        provide: {
            api,
        },
    };
});
