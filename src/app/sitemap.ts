export const runtime = "nodejs";

import type { MetadataRoute } from "next";

import { listAllDeckMetadata } from "@/lib/deck-store";
import { getBaseUrl } from "@/lib/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const decks = await listAllDeckMetadata();
  const generatedAt = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: generatedAt },
    { url: `${baseUrl}/decks`, lastModified: generatedAt },
    { url: `${baseUrl}/decks/upload`, lastModified: generatedAt },
    { url: `${baseUrl}/about`, lastModified: generatedAt },
  ];

  const deckEntries: MetadataRoute.Sitemap = decks.map((deck) => ({
    url: `${baseUrl}/decks/${deck.slug}`,
    lastModified: new Date(deck.updatedAt),
  }));

  return [...staticEntries, ...deckEntries];
}
