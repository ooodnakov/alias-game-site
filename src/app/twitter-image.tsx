import { ImageResponse } from "next/og";
import { getLocale } from "next-intl/server";

import { renderDeckSocialImage } from "@/lib/social-image";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";

export const runtime = "nodejs";
export const size = {
  width: 800,
  height: 418,
};
export const contentType = "image/png";

function isAppLocale(locale: string | null | undefined): locale is AppLocale {
  return locale != null && locales.includes(locale as AppLocale);
}

export default async function TwitterImage() {
  let locale: AppLocale = defaultLocale;

  try {
    const detected = await getLocale();
    if (isAppLocale(detected)) {
      locale = detected;
    }
  } catch {
    // Ignore lookup errors and use default locale
  }

  return new ImageResponse(
    renderDeckSocialImage(undefined, {
      locale,
      width: size.width,
      height: size.height,
      detailPath: "/",
    }),
    {
      ...size,
    },
  );
}
