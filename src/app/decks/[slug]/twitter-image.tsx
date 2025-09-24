import { ImageResponse } from "next/og";
import { getLocale } from "next-intl/server";

import { getDeckBySlug } from "@/lib/deck-store";
import { renderDeckSocialImage } from "@/lib/social-image";

export const runtime = "nodejs";
export const size = {
  width: 800,
  height: 418,
};
export const contentType = "image/png";

export default async function DeckTwitterImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const record = await getDeckBySlug(slug);
  const detailPath = `/decks/${slug}`;

  return new ImageResponse(
    renderDeckSocialImage(record?.metadata, {
      locale,
      width: size.width,
      height: size.height,
      detailPath,
    }),
    {
      ...size,
    },
  );
}