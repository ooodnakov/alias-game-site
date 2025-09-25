import { ImageResponse } from "next/og";
import { getLocale } from "next-intl/server";

import { getDeckBySlug } from "@/lib/deck-store";
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

export default async function DeckTwitterImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getDeckBySlug(slug);

  let locale: AppLocale = defaultLocale;
  try {
    const detected = await getLocale();
    if (isAppLocale(detected)) {
      locale = detected;
    }
  } catch {
    // Ignore detection errors and use default locale
  }

  return new ImageResponse(
    renderDeckSocialImage(record?.metadata, {
      locale,
      width: size.width,
      height: size.height,
      detailPath: `/decks/${slug}`,
    }),
    {
      ...size,
    },
  );
}
