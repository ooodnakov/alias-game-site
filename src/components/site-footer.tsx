import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-foreground/10 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-foreground/70 md:flex-row md:items-center md:justify-between">
        <p>{t("madeWith")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="https://github.com/ooodnakov/alioss-game"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-foreground"
          >
            {t("github")}
          </Link>
          <Link
            href="https://github.com/ooodnakov/alioss-game/issues"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-foreground"
          >
            {t("issues")}
          </Link>
          <span>{t("license")}</span>
        </div>
      </div>
    </footer>
  );
}
