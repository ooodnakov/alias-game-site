import { ImageResponse } from "next/og";

import { getDeckBySlug } from "@/lib/deck-store";
import { renderDeckSocialImage } from "@/lib/social-image";
import type { AppLocale } from "@/i18n/config";
import { getSafeLocale } from "@/i18n/get-safe-locale";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function DeckOpenGraphImage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const record = await getDeckBySlug(slug);

  const locale: AppLocale = await getSafeLocale();

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
