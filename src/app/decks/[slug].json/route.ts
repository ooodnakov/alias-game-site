import { NextResponse } from "next/server";

import { getDeckBySlug } from "@/lib/deck-store";

export async function GET(
  _request: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.json({ message: "Deck not found" }, { status: 404 });
  }
  const record = await getDeckBySlug(slug);

  if (!record) {
    return NextResponse.json({ message: "Deck not found" }, { status: 404 });
  }

  return NextResponse.json(record.deck, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
