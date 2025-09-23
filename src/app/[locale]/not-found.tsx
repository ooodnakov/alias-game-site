import Link from "next-intl/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="bg-surface-muted/40 py-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-semibold text-foreground">{t("title")}</h1>
        <p className="max-w-xl text-sm text-foreground/70">{t("description")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">{t("ctaHome")}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/decks">{t("ctaDecks")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
