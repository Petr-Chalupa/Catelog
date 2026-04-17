import { LOG } from "~~/shared/utils/logger";

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook("request", (event) => {
        event.context.startTime = Date.now();
        event.context.requestId = Math.random().toString(36).substring(2, 9);
    });

    nitroApp.hooks.hook("afterResponse", (event) => {
        const duration = Date.now() - (event.context.startTime || Date.now());
        const statusCode = getResponseStatus(event);

        if (statusCode < 400) {
            LOG({
                level: "INFO",
                message: "Request success",
                context: {
                    requestId: event.context.requestId,
                    method: event.method,
                    path: event.path,
                    status: statusCode,
                    duration: duration,
                },
            });
        }
    });

    nitroApp.hooks.hook("error", (error, { event }) => {
        if (!event) return;

        const duration = Date.now() - (event.context.startTime || Date.now());
        const statusCode = getResponseStatus(event);

        LOG({
            level: statusCode >= 500 ? "ERROR" : "WARN",
            message: "Request error",
            error,
            context: {
                requestId: event.context.requestId,
                method: event.method,
                path: event.path,
                status: statusCode,
                duration: duration,
                user: event.context.user?.id,
                userAgent: event.context.session?.userAgent,
            },
        });
    });
});
