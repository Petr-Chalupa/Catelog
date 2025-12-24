import { createI18n } from "vue-i18n";

export const SUPPORTED_LANGUAGES = ["en", "cs"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export function getDefaultLocale(): Language {
    const browserLang = navigator.language.split("-")[0] as Language;
    return SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : "en";
}

export const i18n = createI18n({
    legacy: false,
    locale: "en",
    fallbackLocale: "en",
    messages: {},
});
