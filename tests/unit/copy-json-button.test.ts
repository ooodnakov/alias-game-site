import { afterEach, describe, expect, it, vi } from "vitest";

import { copyJsonToClipboard } from "@/components/copy-json-button";

const jsonUrl = "https://example.com/deck.json";

describe("copyJsonToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error navigator is added for test purposes
    delete globalThis.navigator;
  });

  it("returns false when clipboard access is rejected", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));

    // @ts-expect-error navigator is added for test purposes
    globalThis.navigator = { clipboard: { writeText } };

    const didCopy = await copyJsonToClipboard(jsonUrl);

    expect(didCopy).toBe(false);
    expect(writeText).toHaveBeenCalledWith(jsonUrl);
  });

  it("returns false when the clipboard API is unavailable", async () => {
    const didCopy = await copyJsonToClipboard(jsonUrl);

    expect(didCopy).toBe(false);
  });

  it("writes to the clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    // @ts-expect-error navigator is added for test purposes
    globalThis.navigator = { clipboard: { writeText } };

    const didCopy = await copyJsonToClipboard(jsonUrl);

    expect(didCopy).toBe(true);
    expect(writeText).toHaveBeenCalledWith(jsonUrl);
  });
});
