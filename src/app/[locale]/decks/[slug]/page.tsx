import type { Metadata } from "next";

import { localizeMetadata } from "@/lib/metadata";

import { generateMetadata as baseGenerateMetadata } from "../../../decks/[slug]/page";

export { generateStaticParams } from "../../../decks/[slug]/page";
export { default } from "../../../decks/[slug]/page";

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const { slug, locale } = params;
  const metadata = await baseGenerateMetadata({
    params: Promise.resolve({ slug }),
  } as Parameters<typeof baseGenerateMetadata>[0]);

  return localizeMetadata(metadata, locale);
}
