import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { LangSwitch } from "@/components/lang-switch";
import { SiteNavLink } from "@/components/site-nav-link";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const t = await getTranslations("nav");

  return (
    <header className="border-b border-foreground/10 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Alias
        </Link>
        <nav className="flex items-center gap-2">
          <SiteNavLink href="/">{t("home")}</SiteNavLink>
          <SiteNavLink href="/decks">{t("decks")}</SiteNavLink>
          <SiteNavLink href="/about">{t("about")}</SiteNavLink>
          <SiteNavLink href="/decks/upload">{t("upload")}</SiteNavLink>
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild size="sm">
            <Link
              href="https://github.com/ooodnakov/alias-game/releases/latest"
              target="_blank"
              rel="noreferrer"
            >
              {t("download")}
            </Link>
          </Button>
          <LangSwitch />
        </div>
      </div>
    </header>
  );
}
