import type { Metadata } from "next";

import { localizeMetadata } from "@/lib/metadata";

import { generateMetadata as baseGenerateMetadata } from "../../../decks/upload/page";

export { default } from "../../../decks/upload/page";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const metadata = await baseGenerateMetadata();
  return localizeMetadata(metadata, params.locale);
}
