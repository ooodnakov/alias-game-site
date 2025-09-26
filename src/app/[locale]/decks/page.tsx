import type { Metadata } from "next";

import { localizeMetadata } from "@/lib/metadata";

import { generateMetadata as baseGenerateMetadata } from "../../decks/page";

export { revalidate } from "../../decks/page";
export { default } from "../../decks/page";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const metadata = await baseGenerateMetadata();
  return localizeMetadata(metadata, params.locale);
}
