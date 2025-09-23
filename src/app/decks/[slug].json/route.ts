import { NextResponse } from "next/server";

import { getDeckBySlug } from "@/lib/deck-store";

interface Params {
  params: { slug: string };
}

export async function GET(_request: Request, { params }: Params) {
  const record = await getDeckBySlug(params.slug);

  if (!record) {
    return NextResponse.json({ message: "Deck not found" }, { status: 404 });
  }

  return NextResponse.json(record.deck, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
