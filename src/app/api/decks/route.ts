import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { defaultLocale } from "@/i18n/config";
import { DeckSchema, type Deck } from "@/lib/deck-schema";
import {
  createDeck,
  getDeckFacets,
  searchDecks,
  type DeckMetadata,
  type DeckStatus,
} from "@/lib/deck-store";
import { buildDeckImportUrl, buildDeckJsonUrl } from "@/lib/url";

function serializeDeck(deck: DeckMetadata, includeModerationFields: boolean) {
  const base = {
    ...deck,
    deckUrl: `/${defaultLocale}/decks/${deck.slug}`,
    jsonUrl: buildDeckJsonUrl(deck.slug),
    importUrl: buildDeckImportUrl(deck.slug),
  };

  if (!includeModerationFields) {
    const { rejectionReason, ...rest } = base;
    void rejectionReason;
    return rest;
  }

  return base;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const session = await auth();
  const isAdmin = Boolean(session?.user?.isAdmin);

  const query = searchParams.get("q") ?? undefined;
  const language = searchParams.get("language") ?? undefined;
  const categoriesParam = searchParams.get("categories") ?? undefined;
  const categories = categoriesParam ? categoriesParam.split(",").map((value) => value.trim()) : undefined;
  const tagsParam = searchParams.get("tags") ?? undefined;
  const tags = tagsParam ? tagsParam.split(",").map((value) => value.trim()) : undefined;
  const difficultyMin = searchParams.get("difficultyMin");
  const difficultyMax = searchParams.get("difficultyMax");
  const includeNSFW = searchParams.get("nsfw") === "true";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "12");
  const statusParam = searchParams.get("status") ?? undefined;
  const statuses = statusParam
    ? statusParam
        .split(",")
        .map((value) => value.trim())
        .filter((value): value is DeckStatus =>
          value === "published" || value === "pending" || value === "rejected",
        )
    : undefined;

  if (statusParam && (!statuses || statuses.length === 0)) {
    return NextResponse.json({ message: "Invalid status filter" }, { status: 400 });
  }

  const requiresAdmin = statuses?.some((status) => status !== "published");
  if (requiresAdmin && !isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await searchDecks({
    query,
    language: language as Deck["language"] | undefined,
    categories,
    includeNSFW,
    tags,
    difficultyMin: difficultyMin ? Number(difficultyMin) : undefined,
    difficultyMax: difficultyMax ? Number(difficultyMax) : undefined,
    page,
    pageSize,
    statuses,
  });

  const facets = await getDeckFacets();

  return NextResponse.json({
    items: result.items.map((deck) => serializeDeck(deck, Boolean(isAdmin))),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    facets: {
      languages: facets.languages,
      categories: facets.categories,
      tags: facets.tags,
      difficulty: {
        min: facets.difficultyMin ?? null,
        max: facets.difficultyMax ?? null,
      },
    },
  });
}

async function parseDeckPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    const coverUrl = formData.get("coverUrl");

    if (!(file instanceof File)) {
      throw new Error("File missing");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File too large");
    }

    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON");
    }

    const parsedDeck = DeckSchema.safeParse(parsed);
    if (!parsedDeck.success) {
      throw new Error("Deck JSON failed validation");
    }

    return {
      data: parsedDeck.data,
      coverUrl: typeof coverUrl === "string" ? coverUrl : undefined,
    };
  }

  const bodyText = await request.text();
  let json;
  try {
    json = JSON.parse(bodyText);
  } catch {
    throw new Error("Invalid JSON");
  }

  const parsedDeck = DeckSchema.safeParse(json);
  if (!parsedDeck.success) {
    throw new Error("Deck JSON failed validation");
  }

  return {
    data: parsedDeck.data,
    coverUrl: undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = Boolean(session?.user?.isAdmin);
    const { data, coverUrl } = await parseDeckPayload(request);

    if (data.words.length > 20000) {
      return NextResponse.json({ message: "Deck too large" }, { status: 400 });
    }

    const metadata = await createDeck(data, {
      coverUrl,
      status: isAdmin ? "published" : undefined,
    });

    return NextResponse.json({
      slug: metadata.slug,
      deckUrl: `/${defaultLocale}/decks/${metadata.slug}`,
      jsonUrl: buildDeckJsonUrl(metadata.slug),
      importUrl: buildDeckImportUrl(metadata.slug),
      status: metadata.status,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Unable to process deck" }, { status: 400 });
  }
}
