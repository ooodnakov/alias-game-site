import type { Metadata } from "next";

import { localizeMetadata } from "@/lib/metadata";

import { generateMetadata as baseGenerateMetadata } from "../../updates/page";

export { default } from "../../updates/page";
export { revalidate } from "../../updates/page";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await baseGenerateMetadata();
  return localizeMetadata(metadata, locale);
}
