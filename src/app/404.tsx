import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { defaultLocale } from "@/i18n/config";
import { Button } from "@/components/ui/button";

export default async function GlobalNotFoundPage() {
  const t = await getTranslations({ locale: defaultLocale, namespace: "notFound" });

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="bg-surface-muted/40 py-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
            <h1 className="text-4xl font-semibold text-foreground">{t("title")}</h1>
            <p className="max-w-xl text-sm text-foreground/70">{t("description")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href={`/${defaultLocale}`}>{t("ctaHome")}</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={`/${defaultLocale}/decks`}>{t("ctaDecks")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
