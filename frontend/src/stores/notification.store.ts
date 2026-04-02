import { defineStore } from "pinia";
import { ref } from "vue";

export interface Notification {
    id: number;
    message: string;
    type: "error" | "success" | "info";
}

export const useNotificationStore = defineStore("notification", () => {
    // --- STATE ---
    const notifications = ref<Notification[]>([]);

    // --- RESET ---
    function $reset() {
        notifications.value = [];
    }

    // --- ACTIONS ---
    function addNotification(message: string, type: Notification["type"] = "error") {
        const id = Date.now();
        notifications.value.push({ id, message, type });

        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    }

    function removeNotification(id: number) {
        notifications.value = notifications.value.filter((n) => n.id !== id);
    }

    return {
        notifications,
        $reset,
        addNotification,
        removeNotification,
    };
});
