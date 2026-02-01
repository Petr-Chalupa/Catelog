import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";

const sw = self as unknown as ServiceWorkerGlobalScope & { __WB_MANIFEST: any };
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(({ url }) => url.pathname.startsWith("/locales/"), new CacheFirst({ cacheName: "translations" }));

let currentLocale = "en";

sw.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SET_LOCALE") {
        currentLocale = event.data.locale;
    }
});

sw.addEventListener("push", (event) => {
    if (!event.data) return;

    const promise = async () => {
        const payload = event.data!.json();
        const cache = await caches.open("translations");
        const response = await cache.match(`/locales/${currentLocale}.json`);
        const translations = response ? await response.json() : {};

        const getNested = (obj: any, path: string) => path.split(".").reduce((prev, curr) => prev?.[curr], obj);

        const replaceParams = (text: string, params: any) => {
            if (!text || !params) return text;
            Object.entries(params).forEach(([k, v]) => (text = text.replace(new RegExp(`{${k}}`, "g"), String(v))));
            return text;
        };

        const msgNode = getNested(translations, payload.msgKey);
        const options = {
            body: replaceParams(msgNode?.body || payload.msgKey, payload.params),
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            data: payload.url || "/",
        };

        return sw.registration.showNotification(
            replaceParams(msgNode?.title || "Notification", payload.params),
            options,
        );
    };

    event.waitUntil(promise());
});

sw.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(sw.clients.openWindow(event.notification.data));
});
