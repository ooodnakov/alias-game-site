import { describe, expect, it } from "vitest";

import { createSlug } from "@/lib/slug";

describe("createSlug", () => {
  it("normalizes casing and whitespace", () => {
    expect(createSlug("  My New Deck  ")).toBe("my-new-deck");
  });

  it("removes unsupported characters", () => {
    expect(createSlug("Deck?!")).toBe("deck");
  });

  it("transliterates accented characters", () => {
    expect(createSlug("Éclair Déjà Vu")).toBe("eclair-deja-vu");
  });
});
