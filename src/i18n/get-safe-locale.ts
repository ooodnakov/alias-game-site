import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { defaultLocale, locales, type AppLocale } from "./config";

function isAppLocale(locale: string | null | undefined): locale is AppLocale {
  return typeof locale === "string" && locales.includes(locale as AppLocale);
}

export async function getSafeLocale(): Promise<AppLocale> {
  try {
    const detected = await getLocale();

    if (isAppLocale(detected)) {
      return detected;
    }
  } catch {
    // Ignore detection errors and use default locale
  }

  const localeCookie = cookies().get("NEXT_LOCALE")?.value;
  if (isAppLocale(localeCookie)) {
    return localeCookie;
  }

  return defaultLocale;
}
