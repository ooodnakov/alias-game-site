import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { CopyJsonButton } from "@/components/copy-json-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeckBySlug, listDeckSlugs } from "@/lib/deck-store";
import { buildDeckImportUrl, buildDeckJsonUrl, getBaseUrl } from "@/lib/url";
import { locales } from "@/i18n/config";

interface DeckDetailPageParams {
  locale: string;
  slug: string;
}

export async function generateStaticParams() {
  const slugs = await listDeckSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<DeckDetailPageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const deck = await getDeckBySlug(slug);

  if (!deck) {
    return {};
  }

  const jsonUrl = buildDeckJsonUrl(deck.metadata.slug);
  const detailPath = `/${locale}/decks/${deck.metadata.slug}`;
  const ogImagePath = `${detailPath}/opengraph-image`;
  const twitterImagePath = `${detailPath}/twitter-image`;
  const importUrl = buildDeckImportUrl(deck.metadata.slug);

  return {
    title: deck.metadata.title,
    description: deck.metadata.description ?? deck.metadata.title,
    openGraph: {
      title: deck.metadata.title,
      description: deck.metadata.description ?? deck.metadata.title,
      images: [
        deck.metadata.coverUrl
          ? deck.metadata.coverUrl
          : ogImagePath,
      ],
      url: detailPath,
    },
    twitter: {
      card: "summary_large_image",
      title: deck.metadata.title,
      description: deck.metadata.description ?? deck.metadata.title,
      images: [deck.metadata.coverUrl ? deck.metadata.coverUrl : twitterImagePath],
    },
    alternates: {
      canonical: detailPath,
      languages: Object.fromEntries(
        locales.map((candidate) => [candidate, `/${candidate}/decks/${deck.metadata.slug}`]),
      ),
    },
    other: {
      "deck-json": jsonUrl,
      "deck-import": importUrl,
    },
  };
}

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<DeckDetailPageParams>;
}) {
  const { locale, slug } = await params;
  const record = await getDeckBySlug(slug);
  const t = await getTranslations("decks");

  if (!record) {
    notFound();
  }

  const jsonUrl = buildDeckJsonUrl(record.metadata.slug);
  const importUrl = buildDeckImportUrl(record.metadata.slug);
  const detailUrl = `${getBaseUrl()}/${locale}/decks/${record.metadata.slug}`;
  const additionalProperties: Array<Record<string, unknown>> = [
    {
      "@type": "PropertyValue",
      name: "Word count",
      value: record.metadata.wordCount,
    },
  ];

  if (
    record.metadata.difficultyMin !== undefined ||
    record.metadata.difficultyMax !== undefined
  ) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Difficulty range",
      value: `${record.metadata.difficultyMin ?? "–"}-${
        record.metadata.difficultyMax ?? "–"
      }`,
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: record.metadata.title,
    description: record.metadata.description ?? record.metadata.title,
    inLanguage: record.metadata.language,
    creator: {
      "@type": "Person",
      name: record.metadata.author,
    },
    url: detailUrl,
    image: record.metadata.coverUrl,
    dateCreated: record.metadata.createdAt,
    dateModified: record.metadata.updatedAt,
    isFamilyFriendly: !record.metadata.nsfw,
    identifier: record.metadata.sha256,
    keywords: Array.from(
      new Set([
        ...record.metadata.categories,
        ...record.metadata.tags,
      ]),
    ).join(", "),
    potentialAction: {
      "@type": "ConsumeAction",
      target: importUrl,
    },
    additionalProperty: additionalProperties,
  };

  return (
    <div className="bg-surface-muted/40 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm md:flex-row md:items-start">
          {record.metadata.coverUrl ? (
            <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-border/40 md:w-72">
              <Image
                src={record.metadata.coverUrl}
                alt={record.metadata.title}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 280px, 100vw"
              />
            </div>
          ) : null}
          <div className="flex flex-1 flex-col gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                {record.metadata.title}
              </h1>
              <p className="text-sm text-foreground/70">{record.metadata.author}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-foreground/70">
              <Badge className="bg-muted text-foreground/80">
                {t("metadata.language")}: {record.metadata.language.toUpperCase()}
              </Badge>
              <Badge className="bg-muted text-foreground/80">
                {t("metadata.wordCount")}: {record.metadata.wordCount.toLocaleString()}
              </Badge>
              {record.metadata.difficultyMin !== undefined || record.metadata.difficultyMax !== undefined ? (
                <Badge className="bg-muted text-foreground/80">
                  {t("metadata.difficulty")}: {record.metadata.difficultyMin ?? "–"}
                  {" "}–{" "}
                  {record.metadata.difficultyMax ?? "–"}
                </Badge>
              ) : null}
              {record.metadata.nsfw ? (
                <Badge className="bg-primary/10 text-primary">{t("metadata.nsfw")}</Badge>
              ) : null}
            </div>
            {record.metadata.description ? (
              <p className="text-sm text-foreground/80">{record.metadata.description}</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm">
                <a href={importUrl}>{t("import")}</a>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/decks">{t("back")}</Link>
              </Button>
              <CopyJsonButton
                jsonUrl={jsonUrl}
                label={t("copyJson")}
                successLabel={t("copied")}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">{t("metadata.categories")}</h2>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/70">
              {record.metadata.categories.map((category) => (
                <li key={category} className="rounded-full bg-muted px-3 py-1">
                  {category}
                </li>
              ))}
            </ul>
            {record.metadata.tags.length ? (
              <>
                <h3 className="mt-6 text-lg font-semibold text-foreground">
                  {t("metadata.tags")}
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/70">
                  {record.metadata.tags.map((tag) => (
                    <li key={tag} className="rounded-full bg-muted px-3 py-1">
                      {tag}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <h3 className="mt-6 text-lg font-semibold text-foreground">
              {t("metadata.wordClasses")}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/70">
              {record.metadata.wordClasses.map((value) => (
                <li key={value} className="rounded-full bg-muted px-3 py-1">
                  {value}
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 text-xs text-foreground/60">
              <p>
                {t("metadata.sha256")}: <span className="font-mono">{record.metadata.sha256}</span>
              </p>
              <p>
                {t("metadata.created")}: {new Date(record.metadata.createdAt).toLocaleDateString()}
              </p>
              <p>
                {t("metadata.updated")}: {new Date(record.metadata.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">{t("details.sample")}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-foreground/80">
              {record.metadata.sampleWords.map((word) => (
                <li key={word} className="rounded-lg bg-muted px-3 py-2">
                  {word}
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 text-sm text-foreground/80">
              <h3 className="font-semibold">{t("details.deepLink")}</h3>
              <code className="block overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs text-foreground/70">
                {importUrl}
              </code>
              <code className="block overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs text-foreground/70">
                {jsonUrl}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
