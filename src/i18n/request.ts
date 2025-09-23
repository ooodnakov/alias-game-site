import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales, type AppLocale } from "./config";

export default getRequestConfig(async ({ locale }) => {
  const appLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;

  return {
    locale: appLocale,
    messages: (await import(`../messages/${appLocale}.json`)).default,
  };
});
