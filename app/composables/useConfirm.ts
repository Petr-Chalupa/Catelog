export default function () {
    const open = useState<boolean>("confirm-open", () => false);
    const title = useState<string | undefined>("confirm-title", () => undefined);
    const message = useState<string | undefined>("confirm-message", () => undefined);
    const resolver = useState<((value: boolean) => void) | null>("confirm-resolver", () => null);

    const confirm = (t: string, m: string): Promise<boolean> => {
        title.value = t;
        message.value = m;
        open.value = true;

        return new Promise((resolve) => {
            resolver.value = resolve;
        });
    };

    const accept = () => {
        resolver.value?.(true);
        close();
    };

    const cancel = () => {
        resolver.value?.(false);
        close();
    };

    const close = () => {
        open.value = false;
        resolver.value = null;
    };

    return {
        open,
        title,
        message,
        confirm,
        accept,
        cancel,
    };
}
