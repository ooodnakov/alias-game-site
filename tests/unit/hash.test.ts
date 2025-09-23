import { describe, expect, it } from "vitest";

import { sha256FromString } from "@/lib/hash";

describe("sha256FromString", () => {
  it("returns a deterministic hash", () => {
    const value = sha256FromString("alias");
    expect(sha256FromString("alias")).toBe(value);
  });

  it("produces different hashes for different inputs", () => {
    const a = sha256FromString("deck-a");
    const b = sha256FromString("deck-b");

    expect(a).not.toBe(b);
  });
});
