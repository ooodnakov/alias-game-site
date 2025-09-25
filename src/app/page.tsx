import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { DeckCard } from "@/components/deck-card";
import { Button } from "@/components/ui/button";
import { listRecentDecks } from "@/lib/deck-store";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ namespace: "meta" });
  const title = t("landing.title");
  const description = t("landing.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image"],
    },
    alternates: {
      canonical: "/",
    },
  };
}

function ScreenMockup({ variant }: { variant: "hero" | "filters" | "history" | "game" }) {
  const baseClass =
    "relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-surface to-primary/40 shadow-lg";

  switch (variant) {
    case "filters":
      return (
        <div className={baseClass}>
          <div className="absolute inset-5 rounded-2xl bg-surface/80 backdrop-blur">
            <div className="absolute left-6 right-6 top-6 h-10 rounded-xl bg-muted/60" />
            <div className="absolute left-6 top-24 h-12 w-28 rounded-xl bg-primary/20" />
            <div className="absolute left-6 right-6 top-24 ml-32 h-12 rounded-xl bg-muted/60" />
            <div className="absolute inset-x-6 bottom-10 flex flex-wrap gap-2 opacity-80">
              {Array.from({ length: 8 }).map((_, index) => (
                <span
                  key={index}
                  className="inline-block h-8 flex-1 rounded-full bg-primary/20"
                />
              ))}
            </div>
          </div>
        </div>
      );
    case "history":
      return (
        <div className={baseClass}>
          <div className="absolute inset-6 rounded-2xl bg-surface/80 backdrop-blur">
            <div className="absolute inset-x-10 top-10 h-10 rounded-xl bg-muted/60" />
            <div className="absolute inset-x-10 bottom-12 h-32 rounded-2xl bg-primary/10">
              <div className="absolute inset-6 grid grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span key={index} className="rounded-xl bg-primary/40" />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    case "game":
      return (
        <div className={baseClass}>
          <div className="absolute inset-6 rounded-2xl bg-surface/80 backdrop-blur">
            <div className="absolute left-6 right-6 top-8 h-8 rounded-xl bg-muted/60" />
            <div className="absolute left-6 top-24 h-40 w-40 rounded-3xl bg-primary/20" />
            <div className="absolute left-52 top-24 right-6 rounded-3xl bg-primary/10" />
            <div className="absolute inset-x-6 bottom-10 flex items-center justify-between rounded-2xl bg-primary/20 px-8 py-6">
              <div className="h-10 w-10 rounded-full bg-surface" />
              <div className="h-6 w-24 rounded-full bg-surface/80" />
              <div className="h-6 w-24 rounded-full bg-surface/80" />
            </div>
          </div>
        </div>
      );
    case "hero":
      return (
        <div className={baseClass}>
          <div className="absolute inset-6 rounded-2xl bg-surface/80 backdrop-blur">
            <div className="absolute left-6 right-6 top-10 h-10 rounded-xl bg-muted/60" />
            <div className="absolute left-6 top-24 h-44 w-40 rounded-3xl bg-primary/20" />
            <div className="absolute right-6 top-24 bottom-16 rounded-3xl bg-muted/50" />
            <div className="absolute inset-x-6 bottom-10 flex items-center justify-between rounded-2xl bg-primary/20 px-8 py-6">
              <div className="h-10 w-10 rounded-full bg-surface" />
              <div className="h-6 w-24 rounded-full bg-surface/80" />
              <div className="h-6 w-16 rounded-full bg-surface/80" />
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className={baseClass}>
          <div className="absolute inset-6 rounded-2xl bg-surface/80 backdrop-blur">
            <div className="absolute left-6 right-6 top-8 h-8 rounded-xl bg-muted/60" />
            <div className="absolute inset-x-6 bottom-12 h-32 rounded-2xl bg-primary/20" />
            <div className="absolute left-6 top-24 h-36 w-40 rounded-3xl bg-primary/10" />
            <div className="absolute right-6 top-24 bottom-16 rounded-3xl bg-muted/50" />
          </div>
        </div>
      );
  }
}

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const decks = await listRecentDecks(6);

  const featureKeys = ["teams", "swipe", "layout", "target", "tutorial"] as const;

  return (
    <div className="space-y-24 pb-24">
      <section className="bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 pb-24 pt-16 text-center md:flex-row md:text-left">
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {t("hero.title")}
              </h1>
              <p className="mt-4 text-lg text-foreground/70">{t("hero.tagline")}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Button asChild size="lg">
                <a
                  href="https://github.com/ooodnakov/alias-game/releases/latest"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("hero.download")}
                </a>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/decks">{t("hero.browseDecks")}</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <a
                  href="https://github.com/ooodnakov/alias-game"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("hero.github")}
                </a>
              </Button>
            </div>
            <p className="text-sm text-foreground/60">{t("hero.note")}</p>
          </div>
          <div className="flex w-full max-w-xl flex-1 justify-center">
            <ScreenMockup variant="hero" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold text-foreground">{t("features.title")}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((key) => (
            <div
              key={key}
              className="flex flex-col rounded-3xl border border-border/60 bg-surface p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {t(`features.items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-foreground/70">
                {t(`features.items.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-muted/40 py-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-foreground">{t("decks.title")}</h2>
              <p className="text-sm text-foreground/70">{t("decks.subtitle")}</p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/decks">{t("decks.viewAll")}</Link>
            </Button>
          </div>
          {decks.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-dashed border-border/60 bg-surface p-10 text-center text-sm text-foreground/60">
              {t("decks.empty")}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold text-foreground">{t("screenshots.title")}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <ScreenMockup variant="game" />
            <p className="text-sm text-foreground/70">{t("screenshots.captions.game")}</p>
          </div>
          <div className="space-y-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <ScreenMockup variant="filters" />
            <p className="text-sm text-foreground/70">{t("screenshots.captions.filters")}</p>
          </div>
          <div className="space-y-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <ScreenMockup variant="history" />
            <p className="text-sm text-foreground/70">{t("screenshots.captions.history")}</p>
          </div>
        </div>
      </section>

      <section className="bg-surface-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-16 text-center md:flex-row md:text-left">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-foreground">{t("cta.title")}</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
            <Button asChild size="lg">
              <a
                href="https://github.com/ooodnakov/alias-game/releases/latest"
                target="_blank"
                rel="noreferrer"
              >
                {t("cta.download")}
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/decks">{t("cta.browse")}</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a
                href="https://github.com/ooodnakov/alias-game"
                target="_blank"
                rel="noreferrer"
              >
                {t("cta.github")}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
