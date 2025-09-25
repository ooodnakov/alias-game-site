import { ImageResponse } from "next/og";
import { renderDeckSocialImage } from "@/lib/social-image";
import type { AppLocale } from "@/i18n/config";
import { getSafeLocale } from "@/i18n/get-safe-locale";

export const runtime = "nodejs";
export const size = {
  width: 800,
  height: 418,
};
export const contentType = "image/png";

export default async function TwitterImage() {
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
