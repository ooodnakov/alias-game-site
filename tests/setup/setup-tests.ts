import { afterEach, beforeEach } from "vitest";

import { __resetDeckStoreForTests } from "@/lib/deck-store";

beforeEach(() => {
  __resetDeckStoreForTests();
});

afterEach(() => {
  __resetDeckStoreForTests();
});
