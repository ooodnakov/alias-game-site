import { ImageResponse } from "next/og";
import { getLocale } from "next-intl/server";

import { renderDeckSocialImage } from "@/lib/social-image";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  let locale: string = "en";
  try {
    locale = await getLocale();
  } catch {
    // During build, getLocale() can throw. Fallback to defaultLocale is intended.
  }
  const detailPath = "/";

  return new ImageResponse(
    renderDeckSocialImage(undefined, {
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