import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/captcha", async () => {
  const actual = await vi.importActual<typeof import("@/lib/captcha")>("@/lib/captcha");
  return {
    ...actual,
    verifyCaptchaToken: vi.fn(actual.verifyCaptchaToken),
  };
});

import { GET as decksGet, POST as decksPost } from "@/app/api/decks/route";
import { __resetDeckStoreForTests } from "@/lib/deck-store";
import type { Deck } from "@/lib/deck-schema";
import { NextRequest } from "next/server";
import * as captcha from "@/lib/captcha";

const FILE_FIELD_NAME = "file";
const CAPTCHA_TOKEN_FIELD_NAME = "captchaToken";
const DECK_FILENAME = "deck.json";
const JSON_CONTENT_TYPE = "application/json";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const createDeckPayload = (overrides: Partial<Deck> = {}): Deck => ({
  title: "Integration Deck",
  author: "Test Runner",
  language: "en",
  allowNSFW: false,
  metadata: {
    categories: ["Test"],
    wordClasses: ["noun"],
  },
  words: Array.from({ length: 20 }, (_, index) => ({
    text: `Card ${index + 1}`,
    difficulty: index % 5,
  })),
  ...overrides,
});

describe("/api/decks", () => {
  beforeEach(() => {
    __resetDeckStoreForTests();
  });

  afterEach(() => {
    vi.clearAllMocks();
    __resetDeckStoreForTests();
  });

  it("returns deck listings with metadata", async () => {
    const request = new NextRequest("http://localhost/api/decks");
    const response = await decksGet(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items.length).toBeGreaterThan(0);
    expect(payload.items[0]).toMatchObject({
      deckUrl: expect.stringContaining("/decks/"),
      jsonUrl: expect.stringContaining("/decks/"),
      importUrl: expect.stringContaining("alioss://"),
    });
  });

  it("creates a deck from JSON payloads", async () => {
    const deck = createDeckPayload();
    const request = new NextRequest("http://localhost/api/decks", {
      method: "POST",
      body: JSON.stringify(deck),
      headers: { "content-type": JSON_CONTENT_TYPE },
    });

    const response = await decksPost(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.slug).toBeDefined();
    expect(payload.importUrl).toContain("alioss://");

    const searchRequest = new NextRequest(
      `http://localhost/api/decks?q=${encodeURIComponent("Integration Deck")}`,
    );
    const searchResponse = await decksGet(searchRequest);
    const searchPayload = await searchResponse.json();

    expect(searchPayload.items.some((item: { slug: string }) => item.slug === payload.slug)).toBe(true);
  });

  it("creates a deck from multipart uploads and returns rate limit headers", async () => {
    const deck = createDeckPayload();
    const formData = new FormData();
    const file = new File([JSON.stringify(deck)], DECK_FILENAME, {
      type: JSON_CONTENT_TYPE,
    });
    formData.append(FILE_FIELD_NAME, file);
    formData.append(CAPTCHA_TOKEN_FIELD_NAME, "test-token");

    const request = new NextRequest("http://localhost/api/decks", {
      method: "POST",
      body: formData,
      headers: {
        "x-forwarded-for": "203.0.113.200",
      },
    });

    const response = await decksPost(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.slug).toBeDefined();
    expect(payload.importUrl).toContain("alioss://");

    expect(response.headers.get("ratelimit-limit")).toBe("10");
    expect(response.headers.get("ratelimit-remaining")).toBe("8");
    const resetHeader = response.headers.get("ratelimit-reset");
    expect(resetHeader).toBeTruthy();
    if (resetHeader) {
      expect(Number.parseInt(resetHeader, 10)).toBeGreaterThan(0);
    }
  });

  it("rejects multipart uploads when the file exceeds the size limit", async () => {
    const oversizedFile = new File([new Uint8Array(MAX_FILE_SIZE_BYTES + 1)], DECK_FILENAME, {
      type: JSON_CONTENT_TYPE,
    });
    const formData = new FormData();
    formData.append(FILE_FIELD_NAME, oversizedFile);

    const request = new NextRequest("http://localhost/api/decks", {
      method: "POST",
      body: formData,
      headers: {
        "x-forwarded-for": "198.51.100.42",
      },
    });

    const response = await decksPost(request);
    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.message).toBe("File too large");
  });

  it("returns a captcha error when verification fails for multipart uploads", async () => {
    const deck = createDeckPayload();
    const formData = new FormData();
    const file = new File([JSON.stringify(deck)], DECK_FILENAME, {
      type: JSON_CONTENT_TYPE,
    });
    formData.append(FILE_FIELD_NAME, file);
    formData.append(CAPTCHA_TOKEN_FIELD_NAME, "invalid-token");

    vi.mocked(captcha.verifyCaptchaToken).mockResolvedValueOnce({
      success: false,
      error: "missing-token",
    });

    const request = new NextRequest("http://localhost/api/decks", {
      method: "POST",
      body: formData,
      headers: {
        "x-forwarded-for": "203.0.113.77",
      },
    });

    const response = await decksPost(request);
    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.message).toBe("Captcha required");
  });

  it("rejects invalid payloads", async () => {
    const request = new NextRequest("http://localhost/api/decks", {
      method: "POST",
      body: JSON.stringify({ title: "Incomplete" }),
      headers: { "content-type": JSON_CONTENT_TYPE },
    });

    const response = await decksPost(request);
    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.message).toBe("Deck JSON failed validation");
  });
});
