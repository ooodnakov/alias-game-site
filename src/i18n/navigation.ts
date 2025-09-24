import { createNavigation } from "next-intl/navigation";

import { defaultLocale, localePrefix, locales } from "./config";

export const { Link, usePathname, useRouter, redirect, permanentRedirect } = createNavigation({
  locales,
  defaultLocale,
  localePrefix,
});
