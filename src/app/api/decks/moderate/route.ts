import { NextResponse, type NextRequest } from "next/server";

import { requestHasAdminToken } from "@/lib/admin-auth";
import { defaultLocale } from "@/i18n/config";
import { getDeckBySlug, updateDeckStatus, type DeckStatus } from "@/lib/deck-store";
import { buildDeckImportUrl, buildDeckJsonUrl } from "@/lib/url";

const allowedStatuses: DeckStatus[] = ["published", "pending", "rejected"];

export async function POST(request: NextRequest) {
  if (!requestHasAdminToken(request.headers)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const { slug, status, rejectionReason } = payload as {
    slug?: unknown;
    status?: unknown;
    rejectionReason?: unknown;
  };

  if (typeof slug !== "string" || !slug.trim()) {
    return NextResponse.json({ message: "Slug required" }, { status: 400 });
  }

  if (typeof status !== "string" || !allowedStatuses.includes(status as DeckStatus)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const normalizedSlug = slug.trim();
  const nextStatus = status as DeckStatus;
  const reasonString =
    typeof rejectionReason === "string"
      ? rejectionReason
      : typeof rejectionReason === "undefined"
      ? undefined
      : String(rejectionReason);

  if (nextStatus === "rejected" && (!reasonString || !reasonString.trim())) {
    return NextResponse.json({ message: "Rejection reason required" }, { status: 400 });
  }

  const updated = await updateDeckStatus(normalizedSlug, nextStatus, {
    rejectionReason: reasonString,
  });

  if (!updated) {
    return NextResponse.json({ message: "Deck not found" }, { status: 404 });
  }

  const record = await getDeckBySlug(normalizedSlug, { includeUnpublished: true });
  if (!record) {
    return NextResponse.json({ message: "Deck not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...record.metadata,
    deckUrl: `/${defaultLocale}/decks/${record.metadata.slug}`,
    jsonUrl: buildDeckJsonUrl(record.metadata.slug),
    importUrl: buildDeckImportUrl(record.metadata.slug),
    deck: record.deck,
  });
}
