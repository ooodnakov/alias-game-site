import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { defaultLocale } from "@/i18n/config";
import { getDeckBySlug } from "@/lib/deck-store";
import { buildDeckImportUrl, buildDeckJsonUrl } from "@/lib/url";

interface Params {
  params: { slug: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const session = await auth();
  const includeUnpublished = Boolean(session?.user?.isAdmin);
  const record = await getDeckBySlug(params.slug, {
    includeUnpublished,
  });

  if (!record) {
    return NextResponse.json({ message: "Deck not found" }, { status: 404 });
  }

  const payload = {
    ...record.metadata,
    deckUrl: `/${defaultLocale}/decks/${record.metadata.slug}`,
    jsonUrl: buildDeckJsonUrl(record.metadata.slug),
    importUrl: buildDeckImportUrl(record.metadata.slug),
    deck: record.deck,
  };

  if (!includeUnpublished) {
    const { rejectionReason, ...rest } = payload;
    void rejectionReason;
    return NextResponse.json(rest);
  }

  return NextResponse.json(payload);
}
