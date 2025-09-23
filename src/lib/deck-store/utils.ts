import { DeckSchema, type Deck } from "@/lib/deck-schema";

export function normalizeDeck(deckInput: Deck): Deck {
  const base = DeckSchema.parse(deckInput);
  const words: Deck["words"] = [];
  const seen = new Set<string>();

  for (const word of base.words) {
    const text = word.text.trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push({
      ...word,
      text,
      category: word.category?.trim() || undefined,
      wordClass: word.wordClass?.trim() || undefined,
    });
  }

  const categories = Array.from(
    new Set((base.metadata.categories ?? []).map((item) => item.trim()).filter(Boolean)),
  );

  const wordClasses = Array.from(
    new Set((base.metadata.wordClasses ?? []).map((item) => item.trim()).filter(Boolean)),
  );

  const normalized: Deck = {
    ...base,
    title: base.title.trim(),
    author: base.author.trim(),
    allowNSFW: base.allowNSFW ?? false,
    metadata: {
      ...base.metadata,
      categories,
      wordClasses,
      coverImage: base.metadata.coverImage,
    },
    words,
  };

  return normalized;
}

export function computeDifficultyRange(words: Deck["words"]) {
  const difficulties = words
    .map((word) => word.difficulty)
    .filter((value): value is number => typeof value === "number");

  if (!difficulties.length) {
    return { min: undefined, max: undefined } as const;
  }

  return {
    min: Math.min(...difficulties),
    max: Math.max(...difficulties),
  } as const;
}

export function buildSearchText(metadata: {
  title: string;
  author: string;
  categories: string[];
  tags: string[];
}) {
  return [metadata.title, metadata.author, ...metadata.categories, ...metadata.tags]
    .map((item) => item.toLowerCase())
    .join(" ");
}
