import { createNavigation } from "next-intl/navigation";

import { localePrefix, locales } from "./config";

export const { Link, usePathname, useRouter, redirect, permanentRedirect } = createNavigation({
  locales,
  localePrefix,
});
