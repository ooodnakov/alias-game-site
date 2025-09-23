import { ImageResponse } from "next/og";

import { getDeckBySlug } from "@/lib/deck-store";
import { renderDeckSocialImage } from "@/lib/social-image";

export const runtime = "edge";
export const size = {
  width: 800,
  height: 418,
};
export const contentType = "image/png";

export default async function DeckTwitterImage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const record = await getDeckBySlug(params.slug);
  const detailPath = `/${params.locale}/decks/${params.slug}`;

  return new ImageResponse(
    renderDeckSocialImage(record?.metadata, {
      locale: params.locale,
      width: size.width,
      height: size.height,
      detailPath,
    }),
    {
      ...size,
    },
  );
}
