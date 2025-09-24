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

const ALIAS_TEST_DB_ENV_KEY = "ALIAS_TEST_DB" as const;
const NEXT_PHASE_ENV_KEY = "NEXT_PHASE" as const;
const MEMORY_STORE_VALUE = "memory" as const;
const PRODUCTION_BUILD_PHASE = "phase-production-build" as const;

const env = typeof process !== "undefined" ? process.env : undefined;

const isProductionBuildPhase = (env?.[NEXT_PHASE_ENV_KEY] ?? null) === PRODUCTION_BUILD_PHASE;

// Use a runtime lookup with bracket notation so Next.js doesn't inline the build-time
// "phase-production-build" value into the compiled bundle (which would otherwise force the
// memory store at runtime as well).
const useMemoryStore = (env?.[ALIAS_TEST_DB_ENV_KEY] ?? null) === MEMORY_STORE_VALUE || isProductionBuildPhase;

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
