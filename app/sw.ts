import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
    if (!event.data) return;

    const promise = async () => {
        const payload = event.data!.json();

        const options: NotificationOptions = {
            body: payload.body || "Something happened!",
            icon: "/pwa-192x192.png",
            badge: "/favicon.svg",
            data: payload.url || "/",
            vibrate: [100, 50, 100],
        };

        return self.registration.showNotification(payload.title || "Catelog", options);
    };

    event.waitUntil(promise());
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow(event.notification.data));
});
