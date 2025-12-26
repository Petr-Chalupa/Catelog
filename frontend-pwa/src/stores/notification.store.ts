import { defineStore } from "pinia";

export interface Notification {
    id: number;
    message: string;
    type: "error" | "success" | "info";
}

export const useNotificationStore = defineStore("notification", {
    state: () => ({
        notifications: [] as Notification[],
    }),
    actions: {
        addNotification(message: string, type: Notification["type"] = "error") {
            const id = Date.now();
            this.notifications.push({ id, message, type });

            setTimeout(() => {
                this.removeNotification(id);
            }, 5000);
        },

        removeNotification(id: number) {
            this.notifications = this.notifications.filter((n) => n.id !== id);
        },
    },
});
