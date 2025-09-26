import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as decksGet, POST as decksPost } from "@/app/api/decks/route";
import { __resetDeckStoreForTests } from "@/lib/deck-store";
import type { Deck } from "@/lib/deck-schema";
import { NextRequest } from "next/server";
import * as captcha from "@/lib/captcha";

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
    vi.restoreAllMocks();
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
      headers: { "content-type": "application/json" },
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
    const file = new File([JSON.stringify(deck)], "deck.json", {
      type: "application/json",
    });
    formData.append("file", file);
    formData.append("captchaToken", "test-token");

    const request = new NextRequest("http://localhost/api/decks", {
      method: "POST",
      body: formData,
      headers: {
        "x-forwarded-for": "192.0.2.1",
      },
    });

    const response = await decksPost(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.slug).toBeDefined();
    expect(payload.importUrl).toContain("alioss://");

    expect(response.headers.get("ratelimit-limit")).toBe("10");
    expect(response.headers.get("ratelimit-remaining")).toBe("9");
    const resetHeader = response.headers.get("ratelimit-reset");
    expect(resetHeader).toBeTruthy();
    if (resetHeader) {
      expect(Number.parseInt(resetHeader, 10)).toBeGreaterThan(0);
    }
  });

  it("rejects multipart uploads when the file exceeds the size limit", async () => {
    const oversizedFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "deck.json", {
      type: "application/json",
    });
    const formData = new FormData();
    formData.append("file", oversizedFile);

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
    const file = new File([JSON.stringify(deck)], "deck.json", {
      type: "application/json",
    });
    formData.append("file", file);
    formData.append("captchaToken", "invalid-token");

    vi.spyOn(captcha, "verifyCaptchaToken").mockResolvedValue({
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
      headers: { "content-type": "application/json" },
    });

    const response = await decksPost(request);
    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.message).toBe("Deck JSON failed validation");
  });
});
