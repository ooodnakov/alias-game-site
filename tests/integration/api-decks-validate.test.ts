import { describe, expect, it } from "vitest";

import { POST as validatePost } from "@/app/api/decks/validate/route";
import type { Deck } from "@/lib/deck-schema";

const createDeckPayload = (): Deck => ({
  title: "Validation Deck",
  author: "Validator",
  language: "en",
  allowNSFW: false,
  metadata: {
    categories: ["Validation"],
    wordClasses: ["noun"],
  },
  words: Array.from({ length: 20 }, (_, index) => ({ text: `Word ${index + 1}` })),
});

describe("/api/decks/validate", () => {
  it("returns details for valid decks", async () => {
    const request = new Request("http://localhost/api/decks/validate", {
      method: "POST",
      body: JSON.stringify(createDeckPayload()),
      headers: { "content-type": "application/json" },
    });

    const response = await validatePost(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.wordCount).toBe(20);
    expect(payload.deck.title).toBe("Validation Deck");
  });

  it("reports schema failures", async () => {
    const request = new Request("http://localhost/api/decks/validate", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });

    const response = await validatePost(request);
    expect(response.status).toBe(400);

    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Deck JSON failed validation");
    expect(Array.isArray(payload.issues)).toBe(true);
  });
});
