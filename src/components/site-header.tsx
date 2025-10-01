import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { LangSwitch } from "@/components/lang-switch";
import { MobileNav } from "@/components/mobile-nav";
import { SiteNavLink } from "@/components/site-nav-link";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/", label: t("home") },
    { href: "/decks", label: t("decks") },
    { href: "/about", label: t("about") },
    { href: "/docs/deck-format", label: t("docs") },
    { href: "/decks/upload", label: t("upload") },
  ];

  const downloadHref =
    process.env.NEXT_PUBLIC_DOWNLOAD_URL ||
    "https://github.com/ooodnakov/alioss/releases/latest";
  const downloadLabel = t("download");

  return (
    <header className="border-b border-foreground/10 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Alioss
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <SiteNavLink key={link.href} href={link.href}>
              {link.label}
            </SiteNavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={downloadHref} target="_blank" rel="noopener noreferrer">
              {downloadLabel}
            </Link>
          </Button>
          <div className="hidden md:block">
            <LangSwitch />
          </div>
          <MobileNav
            links={links}
            downloadHref={downloadHref}
            downloadLabel={downloadLabel}
            menuLabel={t("menu")}
            closeLabel={t("closeMenu")}
          />
        </div>
      </div>
    </header>
  );
}
