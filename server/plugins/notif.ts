import webpush from "web-push";
import { LOG } from "~~/shared/utils/logger";

export default defineNitroPlugin(async (nitroApp) => {
    const config = useRuntimeConfig();

    LOG({ level: "INFO", message: "Setting VAPID details..." });
    webpush.setVapidDetails(config.VAPID_SUBJECT, config.public.VAPID_PUBLIC_KEY, config.VAPID_PRIVATE_KEY);
});
