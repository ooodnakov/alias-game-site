import { NextResponse } from "next/server";

import { DeckSchema } from "@/lib/deck-schema";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" },
      { status: 400 },
    );
  }

  const result = DeckSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Deck JSON failed validation",
        issues: result.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          code: issue.code,
        })),
      },
      { status: 400 },
    );
  }

  const deck = result.data;

  return NextResponse.json({
    success: true,
    deck,
    wordCount: deck.words.length,
    language: deck.language,
  });
}
