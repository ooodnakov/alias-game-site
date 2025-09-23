import { ImageResponse } from "next/og";

import { renderDeckSocialImage } from "@/lib/social-image";

export const runtime = "edge";
export const size = {
  width: 800,
  height: 418,
};
export const contentType = "image/png";

export default function LocaleTwitterImage({
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
