import type { Metadata } from "next";

import { localizeMetadata } from "@/lib/metadata";

import { generateMetadata as baseGenerateMetadata } from "../../../admin/decks/page";

export { dynamic } from "../../../admin/decks/page";
export { default } from "../../../admin/decks/page";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await baseGenerateMetadata();
  return localizeMetadata(metadata, locale);
}
