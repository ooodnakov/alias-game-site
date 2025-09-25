export const locales = ["en", "ru"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const localePrefix = "never" as const;

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  ru: "Русский",
};
