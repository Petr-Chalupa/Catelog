import { precacheAndRoute } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

// --- CACHING ---
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(({ request }) => request.mode === "navigate", new NetworkFirst({ cacheName: "pages" }));

registerRoute(
    ({ request }) => request.destination === "style" || request.destination === "script",
    new StaleWhileRevalidate({ cacheName: "assets" }),
);

setCatchHandler(async ({ event }) => {
    const request = (event as FetchEvent).request;
    if (request.mode === "navigate") {
        const cached = await caches.match("/app");
        if (cached) return cached;
    }
    return new Response("Offline", { status: 200 });
});

// --- PUSH NOTIFICATIONS ---
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

// --- LIFECYCLE ---
self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});
