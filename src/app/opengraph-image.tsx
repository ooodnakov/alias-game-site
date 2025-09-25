import { ImageResponse } from "next/og";
import { renderDeckSocialImage } from "@/lib/social-image";
import type { AppLocale } from "@/i18n/config";
import { getSafeLocale } from "@/i18n/get-safe-locale";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const locale: AppLocale = await getSafeLocale();

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
