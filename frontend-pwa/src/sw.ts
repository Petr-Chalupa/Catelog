import { precacheAndRoute } from "workbox-precaching";

const sw = self as unknown as ServiceWorkerGlobalScope & { __WB_MANIFEST: any };
precacheAndRoute(self.__WB_MANIFEST);

sw.addEventListener("push", (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            data: data.url || "/",
        };

        event.waitUntil(sw.registration.showNotification(data.title, options));
    } catch (err) {
        console.error("Push event error:", err);
    }
});

sw.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(sw.clients.openWindow(event.notification.data));
});
