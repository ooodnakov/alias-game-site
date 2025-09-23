export const runtime = "nodejs";

import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { listAllDeckMetadata } from "@/lib/deck-store";
import { getBaseUrl } from "@/lib/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const decks = await listAllDeckMetadata();
  const generatedAt = new Date();

  const staticEntries = locales.flatMap<MetadataRoute.Sitemap[number]>((locale) => {
    const prefix = `${baseUrl}/${locale}`;
    return [
      { url: prefix, lastModified: generatedAt },
      { url: `${prefix}/decks`, lastModified: generatedAt },
      { url: `${prefix}/decks/upload`, lastModified: generatedAt },
      { url: `${prefix}/about`, lastModified: generatedAt },
    ];
  });

  const deckEntries = locales.flatMap<MetadataRoute.Sitemap[number]>((locale) =>
    decks.map((deck) => ({
      url: `${baseUrl}/${locale}/decks/${deck.slug}`,
      lastModified: new Date(deck.updatedAt),
    })),
  );

  return [...staticEntries, ...deckEntries];
}
