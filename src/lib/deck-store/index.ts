import { dbDeckStore } from "./db";
import { memoryDeckStore } from "./memory";
import type { DeckStore } from "./types";

export type {
  DeckFacets,
  DeckFilters,
  DeckMetadata,
  DeckRecord,
  DeckSearchResult,
  DeckSeed,
  DeckStatus,
  DeckStore,
} from "./types";

const useMemoryStore = process.env.ALIAS_TEST_DB === "memory";

const store: DeckStore = useMemoryStore ? memoryDeckStore : dbDeckStore;

export const listRecentDecks = store.listRecentDecks;
export const listAllDeckMetadata = store.listAllDeckMetadata;
export const getDeckBySlug = store.getDeckBySlug;
export const searchDecks = store.searchDecks;
export const createDeck = store.createDeck;
export const getDeckFacets = store.getDeckFacets;
export const listDeckSlugs = store.listDeckSlugs;
export const updateDeckStatus = store.updateDeckStatus;

export function __resetDeckStoreForTests() {
  return store.resetForTests();
}
