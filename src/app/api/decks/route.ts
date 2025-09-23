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
import { verifyCaptchaToken } from "@/lib/captcha";
import { createRateLimiter, type RateLimitResult } from "@/lib/rate-limit";

function parseNumber(value: string | undefined, fallback: number) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getClientIp(request: NextRequest) {
  if (request.ip) {
    return request.ip;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    const last = parts[parts.length - 1];
    if (last) {
      return last;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

const deckUploadRateLimiter = createRateLimiter({
  limit: parseNumber(process.env.DECK_UPLOAD_RATE_LIMIT, 10),
  window: parseNumber(process.env.DECK_UPLOAD_RATE_WINDOW_SECONDS, 3600),
  prefix: "deck-upload",
});

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
    const captchaField = formData.get("captchaToken") ?? formData.get("h-captcha-response");
    const captchaToken = typeof captchaField === "string" ? captchaField : undefined;

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
      captchaToken,
    };
  }

  const bodyText = await request.text();
  let json: Record<string, unknown>;
  try {
    const parsed = JSON.parse(bodyText);
    json = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
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
    captchaToken: typeof json.captchaToken === "string" ? json.captchaToken : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    let rateLimitResult: RateLimitResult | null = null;

    if (deckUploadRateLimiter.enabled) {
      rateLimitResult = await deckUploadRateLimiter.check(clientIp);

      if (!rateLimitResult.success) {
        const retryAfterSeconds = Math.max(0, Math.ceil((rateLimitResult.reset - Date.now()) / 1000));
        return NextResponse.json(
          { message: "Rate limit exceeded" },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfterSeconds),
              "RateLimit-Limit": String(rateLimitResult.limit),
              "RateLimit-Remaining": String(rateLimitResult.remaining),
              "RateLimit-Reset": String(Math.ceil(rateLimitResult.reset / 1000)),
            },
          },
        );
      }
    }

    const session = await auth();
    const isAdmin = Boolean(session?.user?.isAdmin);
    const { data, coverUrl, captchaToken } = await parseDeckPayload(request);

    const captchaResult = await verifyCaptchaToken(
      captchaToken,
      clientIp === "unknown" ? undefined : clientIp,
    );
    if (!captchaResult.success) {
      const message = captchaResult.error === "missing-token" ? "Captcha required" : "Captcha verification failed";
      return NextResponse.json({ message }, { status: 400 });
    }

    if (data.words.length > 20000) {
      return NextResponse.json({ message: "Deck too large" }, { status: 400 });
    }

    const metadata = await createDeck(data, {
      coverUrl,
      status: isAdmin ? "published" : undefined,
    });

    const response = NextResponse.json({
      slug: metadata.slug,
      deckUrl: `/${defaultLocale}/decks/${metadata.slug}`,
      jsonUrl: buildDeckJsonUrl(metadata.slug),
      importUrl: buildDeckImportUrl(metadata.slug),
      status: metadata.status,
    });

    if (rateLimitResult) {
      response.headers.set("RateLimit-Limit", String(rateLimitResult.limit));
      response.headers.set("RateLimit-Remaining", String(rateLimitResult.remaining));
      response.headers.set("RateLimit-Reset", String(Math.ceil(rateLimitResult.reset / 1000)));
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Unable to process deck" }, { status: 400 });
  }
}
