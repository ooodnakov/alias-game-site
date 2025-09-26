import { afterEach, describe, expect, it, vi } from "vitest";

import { copyJsonToClipboard } from "@/components/copy-json-button";

const jsonUrl = "https://example.com/deck.json";

describe("copyJsonToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error navigator is added for test purposes
    delete globalThis.navigator;
    // @ts-expect-error window is added for test purposes
    delete globalThis.window;
  });

  it("falls back to the manual copy prompt when clipboard access is rejected", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));

    // @ts-expect-error navigator is added for test purposes
    globalThis.navigator = { clipboard: { writeText } };

    const prompt = vi.fn();
    // @ts-expect-error window is added for test purposes
    globalThis.window = { prompt };

    const didCopy = await copyJsonToClipboard(jsonUrl);

    expect(didCopy).toBe(false);
    expect(writeText).toHaveBeenCalledWith(jsonUrl);
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(prompt.mock.calls[0]?.[1]).toBe(jsonUrl);
  });
});
