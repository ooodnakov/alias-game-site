import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { DeckCard } from "@/components/deck-card";
import { DeckFilters } from "@/components/deck-filters";
import { Button } from "@/components/ui/button";
import { getDeckFacets, searchDecks } from "@/lib/deck-store";

export const revalidate = 300;

type DeckSearchParams = Record<string, string | string[]>;

interface DeckGalleryPageProps {
  searchParams?: DeckSearchParams | Promise<DeckSearchParams>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("decks.title");
  const description = t("decks.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/decks",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image"],
    },
    alternates: {
      canonical: "/decks",
    },
  };
}

export default async function DeckGalleryPage({ searchParams }: DeckGalleryPageProps) {
  const t = await getTranslations("decks");
  const facets = await getDeckFacets();

  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});

  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;
  const language =
    typeof resolvedSearchParams.language === "string" ? resolvedSearchParams.language : undefined;
  const categoriesParam = Array.isArray(resolvedSearchParams.categories)
    ? resolvedSearchParams.categories.join(",")
    : resolvedSearchParams.categories;
  const categories = categoriesParam
    ? categoriesParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const tagsParam = Array.isArray(resolvedSearchParams.tags)
    ? resolvedSearchParams.tags.join(",")
    : resolvedSearchParams.tags;
  const tags = tagsParam
    ? tagsParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const difficultyMin = resolvedSearchParams.difficultyMin
    ? Number(
        Array.isArray(resolvedSearchParams.difficultyMin)
          ? resolvedSearchParams.difficultyMin[0]
          : resolvedSearchParams.difficultyMin,
      )
    : undefined;
  const difficultyMax = resolvedSearchParams.difficultyMax
    ? Number(
        Array.isArray(resolvedSearchParams.difficultyMax)
          ? resolvedSearchParams.difficultyMax[0]
          : resolvedSearchParams.difficultyMax,
      )
    : undefined;
  const includeNSFW = Array.isArray(resolvedSearchParams.nsfw)
    ? resolvedSearchParams.nsfw.includes("true")
    : resolvedSearchParams.nsfw === "true";
  const page = resolvedSearchParams.page
    ? Number(
        Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page,
      )
    : 1;

  const result = await searchDecks({
    query,
    language: language as typeof facets.languages[number] | undefined,
    categories,
    tags,
    includeNSFW,
    difficultyMin: Number.isFinite(difficultyMin) ? difficultyMin : undefined,
    difficultyMax: Number.isFinite(difficultyMax) ? difficultyMax : undefined,
    page,
    pageSize: 12,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const currentParams = new URLSearchParams();
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => currentParams.append(key, item));
    } else if (value !== undefined) {
      currentParams.set(key, value);
    }
  });

  const createPageHref = (targetPage: number) => {
    const params = new URLSearchParams(currentParams.toString());
    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", targetPage.toString());
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  return (
    <div className="bg-surface-muted/40 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
        </div>
        <DeckFilters
          searchPlaceholder={t("searchPlaceholder")}
          labels={{
            language: t("filters.language"),
            difficultyMin: t("filters.difficultyMin"),
            difficultyMax: t("filters.difficultyMax"),
            categories: t("filters.categories"),
            tags: t("filters.tags"),
            nsfw: t("filters.nsfw"),
            apply: t("filters.apply"),
            reset: t("filters.reset"),
          }}
          available={{
            languages: facets.languages,
            categories: facets.categories,
            tags: facets.tags,
            difficultyMin: facets.difficultyMin,
            difficultyMax: facets.difficultyMax,
          }}
          initial={{
            query,
            language,
            categories,
            tags,
            difficultyMin: Number.isFinite(difficultyMin) ? difficultyMin : undefined,
            difficultyMax: Number.isFinite(difficultyMax) ? difficultyMax : undefined,
            includeNSFW,
          }}
        />
        {result.items.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-border/60 bg-surface p-10 text-center text-sm text-foreground/60">
            {t("empty")}
          </p>
        )}
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border/60 pt-6">
            {page > 1 ? (
              <Button asChild variant="ghost">
                <Link href={`/decks${createPageHref(page - 1)}`}>{t("pagination.previous")}</Link>
              </Button>
            ) : (
              <span />
            )}
            <p className="text-sm text-foreground/60">
              {page} / {totalPages}
            </p>
            {page < totalPages ? (
              <Button asChild variant="ghost">
                <Link href={`/decks${createPageHref(page + 1)}`}>{t("pagination.next")}</Link>
              </Button>
            ) : (
              <span />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
