export default function <T extends (...args: any[]) => any>(fn: T, delay: number) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedFn = (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            fn(...args);
        }, delay);
    };

    onBeforeUnmount(() => {
        if (timeoutId) clearTimeout(timeoutId);
    });

    return debouncedFn;
}
