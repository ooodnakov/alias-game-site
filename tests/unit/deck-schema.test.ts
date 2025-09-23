import { describe, expect, it } from "vitest";

import { DeckSchema, DeckWordSchema } from "@/lib/deck-schema";

describe("DeckSchema", () => {
  const createWords = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ text: `Word ${index + 1}` }));

  it("parses a minimal deck and applies defaults", () => {
    const result = DeckSchema.parse({
      title: "Community Deck",
      author: "Tester",
      language: "en",
      words: createWords(20),
    });

    expect(result.allowNSFW).toBe(false);
    expect(result.metadata.categories).toEqual([]);
    expect(result.metadata.wordClasses).toEqual([]);
    expect(result.metadata.coverImage).toBeUndefined();
  });

  it("rejects decks with too few words", () => {
    const result = DeckSchema.safeParse({
      title: "Short Deck",
      author: "Tester",
      language: "en",
      words: createWords(5),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["words"]);
    }
  });

  it("enforces word validation constraints", () => {
    expect(() =>
      DeckWordSchema.parse({
        text: "",
        difficulty: 2,
      }),
    ).toThrowError();

    const word = DeckWordSchema.parse({
      text: "Clue",
      difficulty: 3,
      category: "Party",
    });

    expect(word).toEqual({
      text: "Clue",
      difficulty: 3,
      category: "Party",
    });
  });
});
