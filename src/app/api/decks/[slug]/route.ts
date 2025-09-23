import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { defaultLocale } from "@/i18n/config";
import { getDeckBySlug } from "@/lib/deck-store";
import { buildDeckImportUrl, buildDeckJsonUrl } from "@/lib/url";

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) {
  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.json({ message: "Deck not found" }, { status: 404 });
  }
  const session = await auth();
  const includeUnpublished = Boolean(session?.user?.isAdmin);
  const record = await getDeckBySlug(slug, {
    includeUnpublished,
  });

  if (!record) {
    return NextResponse.json({ message: "Deck not found" }, { status: 404 });
  }

  const payload = {
    ...record.metadata,
    deckUrl: `/${defaultLocale}/decks/${slug}`,
    jsonUrl: buildDeckJsonUrl(slug),
    importUrl: buildDeckImportUrl(slug),
    deck: record.deck,
  };

  if (!includeUnpublished) {
    const { rejectionReason, ...rest } = payload;
    void rejectionReason;
    return NextResponse.json(rest);
  }

  return NextResponse.json(payload);
}
