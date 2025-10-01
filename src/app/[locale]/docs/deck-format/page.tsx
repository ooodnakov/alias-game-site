import type { Metadata } from "next";

import { localizeMetadata } from "@/lib/metadata";

import { generateMetadata as baseGenerateMetadata } from "../../../docs/deck-format/page";

export { default } from "../../../docs/deck-format/page";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await baseGenerateMetadata();
  return localizeMetadata(metadata, locale);
}
