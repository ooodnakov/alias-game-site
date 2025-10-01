import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { CopyJsonButton } from "@/components/copy-json-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DeckMetadata } from "@/lib/deck-store";
import { buildDeckImportUrl, buildDeckJsonUrl } from "@/lib/url";

export async function DeckCard({ deck }: { deck: DeckMetadata }) {
  const t = await getTranslations("decks");
  const jsonUrl = buildDeckJsonUrl(deck.slug);
  const importUrl = buildDeckImportUrl(deck.slug);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      {deck.coverUrl ? (
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          <Image
            src={deck.coverUrl}
            alt={deck.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-4 p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {deck.title}
            </h3>
            <p className="text-sm text-foreground/70">{deck.author}</p>
          </div>
          <Badge>{deck.language.toUpperCase()}</Badge>
        </header>
        {deck.description ? (
          <p className="text-sm text-foreground/80">{deck.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/70">
          <Badge className="bg-muted text-foreground/80">
            {deck.wordCount.toLocaleString()} {t("words")}
          </Badge>
          {deck.difficultyMin !== undefined || deck.difficultyMax !== undefined ? (
            <Badge className="bg-muted text-foreground/80">
              {t("metadata.difficulty")}: {deck.difficultyMin ?? "–"}
              {" "}–{" "}
              {deck.difficultyMax ?? "–"}
            </Badge>
          ) : null}
          {deck.nsfw ? (
            <Badge className="bg-primary/10 text-primary">
              {t("nsfw")}
            </Badge>
          ) : null}
        </div>
        <ul className="flex flex-wrap gap-2 text-xs text-foreground/60">
          {deck.categories.map((category) => (
            <li key={category} className="rounded-full bg-muted px-3 py-1">
              {category}
            </li>
          ))}
        </ul>
        {deck.tags.length ? (
          <ul className="flex flex-wrap gap-2 text-xs text-foreground/60">
            {deck.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-muted/60 px-3 py-1">
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-3">
          <Button asChild size="sm">
            <Link href={`/decks/${deck.slug}`}>{t("import")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={importUrl}>{t("openInApp")}</a>
          </Button>
          <CopyJsonButton
            jsonUrl={jsonUrl}
            label={t("copyJson")}
            successLabel={t("copied")}
          />
        </div>
      </div>
    </article>
  );
}
