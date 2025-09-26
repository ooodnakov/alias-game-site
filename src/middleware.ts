import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { defaultLocale, localePrefix, locales } from "@/i18n/config";

const i18nMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

export default function middleware(request: Parameters<typeof i18nMiddleware>[0]) {
  if (process.env.DISABLE_I18N_MIDDLEWARE === "true") {
    return NextResponse.next();
  }

  return i18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
