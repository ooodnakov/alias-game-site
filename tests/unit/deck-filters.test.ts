import { describe, expect, it } from "vitest";

import { buildDeckFiltersPath } from "@/components/deck-filters-helpers";

describe("buildDeckFiltersPath", () => {
  it("returns pathname without trailing question mark when no filters are applied", () => {
    const params = new URLSearchParams();

    expect(buildDeckFiltersPath("/decks", params)).toBe("/decks");
  });

  it("appends query parameters when filters are present", () => {
    const params = new URLSearchParams();
    params.set("q", "test");

    expect(buildDeckFiltersPath("/decks", params)).toBe("/decks?q=test");
  });
});
