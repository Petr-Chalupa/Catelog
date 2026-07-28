export default defineNuxtPlugin((nuxtApp) => {
    const locale = useState<string>("locale", () => "en");

    nuxtApp.hook("app:mounted", () => {
        const browserLang = window.navigator.language.split("-")[0] ?? "en";
        if (locale.value !== browserLang) locale.value = browserLang;
    });
});
