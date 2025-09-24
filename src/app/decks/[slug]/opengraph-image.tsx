import { ImageResponse } from "next/og";
import { getLocale } from "next-intl/server";

import { getDeckBySlug } from "@/lib/deck-store";
import { renderDeckSocialImage } from "@/lib/social-image";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function DeckOpenGraphImage({
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