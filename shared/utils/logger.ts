export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogEntry {
    level: LogLevel;
    message?: string;
    error?: Error;
    context?: {
        requestId?: string;
        method?: string;
        path?: string;
        status?: number;
        duration?: number;
        user?: string;
        userAgent?: string | null;
        [key: string]: unknown;
    };
}

export function LOG(entry: LogEntry) {
    const isProd = useRuntimeConfig().public.ENV === "production";
    const timestamp = new Date().toISOString();
    let outStr = "";

    if (isProd) {
        let entryProd = { timestamp, ...entry };
        delete entryProd.error?.stack;
        outStr = JSON.stringify(entryProd);
    } else {
        const colors: Record<LogLevel, string> = {
            INFO: "\x1b[36m", // Cyan
            DEBUG: "\x1b[35m", // Magenta
            WARN: "\x1b[33m", // Yellow
            ERROR: "\x1b[31m", // Red
        };
        const color = colors[entry.level];
        const reset = "\x1b[0m";

        outStr = `${color}[${entry.level}]${reset} [${timestamp}] ${entry.message}`;
        if (entry.context) {
            outStr += `\n ${JSON.stringify(entry.context)}`;
        }
        if (entry.error) {
            outStr += `\n Error: ${entry.error.name} - ${entry.error.message}`;
            if (entry.error.cause) {
                outStr += `\n  ${JSON.stringify(entry.error.cause)}`;
            }
            if (entry.error.stack) {
                outStr += `\n  ${JSON.stringify(entry.error.stack)}`;
            }
        }
    }

    switch (entry.level) {
        case "INFO":
            console.info(outStr);
            break;
        case "WARN":
            console.warn(outStr);
            break;
        case "ERROR":
            console.error(outStr);
            break;
        default:
            console.debug(outStr);
            break;
    }
}
