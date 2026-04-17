export default function () {
    const toasts = useState<Toast[]>("toasts", () => []);

    const removeToast = (id: string) => {
        toasts.value = toasts.value.filter((n) => n.id !== id);
    };

    const addToast = (message: string, type: Toast["type"], timeout: number) => {
        const id = crypto.randomUUID();
        toasts.value.push({ id, message, type });
        if (import.meta.client) setTimeout(() => removeToast(id), timeout);
    };

    const error = (msg: string, error?: any) => {
        addToast(msg, "error", 5000);
        if (import.meta.client) LOG({ level: "ERROR", message: msg, error });
    };

    const warn = (msg: string) => {
        addToast(msg, "warn", 4000);
        if (import.meta.client) LOG({ level: "WARN", message: msg });
    };

    const success = (msg: string) => {
        addToast(msg, "success", 3000);
        if (import.meta.client) LOG({ level: "INFO", message: msg });
    };

    const info = (msg: string) => {
        addToast(msg, "info", 4000);
        if (import.meta.client) LOG({ level: "INFO", message: msg });
    };

    return {
        toasts,
        removeToast,
        error,
        warn,
        success,
        info,
    };
}
