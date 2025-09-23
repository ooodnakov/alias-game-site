import { ImageResponse } from "next/og";

import { renderDeckSocialImage } from "@/lib/social-image";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function LocaleOpenGraphImage({
  params,
}: {
  params: { locale: string };
}) {
  const detailPath = `/${params.locale}`;

  return new ImageResponse(
    renderDeckSocialImage(undefined, {
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
