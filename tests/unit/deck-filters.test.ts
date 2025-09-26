import { describe, expect, it } from "vitest";

import { buildPathWithQuery } from "@/components/path-helpers";

describe("buildPathWithQuery", () => {
  it("returns pathname without trailing question mark when no filters are applied", () => {
    const params = new URLSearchParams();

    expect(buildPathWithQuery("/decks", params)).toBe("/decks");
  });

  it("appends query parameters when filters are present", () => {
    const params = new URLSearchParams();
    params.set("q", "test");

    expect(buildPathWithQuery("/decks", params)).toBe("/decks?q=test");
  });
});
