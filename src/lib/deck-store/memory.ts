import { randomUUID } from "node:crypto";

import { sampleDeckSeeds } from "@/data/sample-decks";
import type { Deck } from "@/lib/deck-schema";
import { sha256FromString } from "@/lib/hash";
import { createSlug } from "@/lib/slug";

import { buildSearchText, computeDifficultyRange, normalizeDeck } from "./utils";
import type {
  DeckFacets,
  DeckFilters,
  DeckMetadata,
  DeckRecord,
  DeckSearchResult,
  DeckStatus,
  DeckStore,
} from "./types";

interface MemoryDeckStoreState {
  initialized: boolean;
  records: DeckRecord[];
}

const memoryStoreState: MemoryDeckStoreState = {
  initialized: false,
  records: [],
};

function memoryResetStore() {
  memoryStoreState.initialized = false;
  memoryStoreState.records = [];
}

async function memoryEnsureReady() {
  if (!memoryStoreState.initialized) {
    memorySeedDatabase();
    memoryStoreState.initialized = true;
  }
}

function memorySeedDatabase() {
  memoryStoreState.records = [];

  for (const seed of sampleDeckSeeds) {
    const normalized = normalizeDeck(seed.deck);
    const slugCandidate = seed.slug ? createSlug(seed.slug) : memoryGenerateUniqueSlug(normalized.title);
    const finalSlug = slugCandidate || memoryGenerateUniqueSlug(normalized.title);

    if (memorySlugExists(finalSlug)) {
      continue;
    }

    const jsonPath = `/decks/${finalSlug}.json`;
    const sha256 = sha256FromString(JSON.stringify(normalized));
    const difficulty = computeDifficultyRange(normalized.words);
    const status = seed.status ?? "published";
    const rejectionReason =
      status === "rejected" ? seed.rejectionReason?.trim() || undefined : undefined;

    const metadata: DeckMetadata = {
      id: randomUUID(),
      slug: finalSlug,
      title: normalized.title,
      author: normalized.author,
      language: normalized.language,
      difficultyMin: difficulty.min,
      difficultyMax: difficulty.max,
      categories: [...(normalized.metadata.categories ?? [])],
      wordClasses: [...(normalized.metadata.wordClasses ?? [])],
      wordCount: normalized.words.length,
      coverUrl: normalized.metadata.coverImage ?? undefined,
      jsonPath,
      sha256,
      nsfw: normalized.allowNSFW,
      createdAt: seed.createdAt,
      updatedAt: seed.updatedAt,
      submittedBy: seed.submittedBy ?? null,
      description: seed.description,
      tags: [...(seed.tags ?? normalized.metadata.categories ?? [])],
      sampleWords: normalized.words.slice(0, 12).map((word) => word.text),
      status,
      rejectionReason,
    };

    memoryStoreState.records.push({
      metadata,
      deck: normalized,
    });
  }
}

function memorySlugExists(slug: string) {
  return memoryStoreState.records.some((record) => record.metadata.slug === slug);
}

function memoryGenerateUniqueSlug(title: string) {
  let base = createSlug(title);
  if (!base) {
    base = `deck-${Date.now()}`;
  }

  let candidate = base;
  let attempt = 1;

  while (memorySlugExists(candidate)) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }

  return candidate;
}

function memoryCloneMetadata(metadata: DeckMetadata): DeckMetadata {
  return JSON.parse(JSON.stringify(metadata));
}

function memoryCloneDeck(deck: Deck): Deck {
  return JSON.parse(JSON.stringify(deck)) as Deck;
}

function memoryCloneDeckRecord(record: DeckRecord): DeckRecord {
  return {
    metadata: memoryCloneMetadata(record.metadata),
    deck: memoryCloneDeck(record.deck),
  };
}

async function memoryListRecentDecks(limit = 6, options: { statuses?: DeckStatus[] } = {}) {
  await memoryEnsureReady();
  const statuses = options.statuses?.length ? options.statuses : ["published"];
  let records = memoryStoreState.records.slice();
  if (statuses.length) {
    records = records.filter((record) => statuses.includes(record.metadata.status));
  }
  records.sort((a, b) => (a.metadata.updatedAt < b.metadata.updatedAt ? 1 : -1));
  return records.slice(0, limit).map((record) => memoryCloneMetadata(record.metadata));
}

async function memoryListAllDeckMetadata(options: { statuses?: DeckStatus[] } = {}) {
  await memoryEnsureReady();
  const statuses = options.statuses?.length ? options.statuses : ["published"];
  let records = memoryStoreState.records.slice();
  if (statuses.length) {
    records = records.filter((record) => statuses.includes(record.metadata.status));
  }
  records.sort((a, b) => (a.metadata.updatedAt < b.metadata.updatedAt ? 1 : -1));
  return records.map((record) => memoryCloneMetadata(record.metadata));
}

async function memoryGetDeckBySlug(
  slug: string,
  options: { includeUnpublished?: boolean; statuses?: DeckStatus[] } = {},
) {
  await memoryEnsureReady();
  const record = memoryStoreState.records.find((item) => item.metadata.slug === slug);
  if (!record) {
    return null;
  }

  if (!options.includeUnpublished) {
    const statuses = options.statuses?.length ? options.statuses : ["published"];
    if (statuses.length && !statuses.includes(record.metadata.status)) {
      return null;
    }
  }

  return memoryCloneDeckRecord(record);
}

async function memorySearchDecks(filters: DeckFilters = {}): Promise<DeckSearchResult> {
  await memoryEnsureReady();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(30, filters.pageSize ?? 12));
  const query = filters.query?.toLowerCase().trim();

  const statuses = filters.statuses?.length ? filters.statuses : ["published"];

  let records = memoryStoreState.records.slice();

  if (statuses.length) {
    records = records.filter((record) => statuses.includes(record.metadata.status));
  }

  if (!filters.includeNSFW) {
    records = records.filter((record) => !record.metadata.nsfw);
  }

  if (filters.language) {
    records = records.filter((record) => record.metadata.language === filters.language);
  }

  if (filters.categories?.length) {
    records = records.filter((record) =>
      filters.categories?.every((category) => record.metadata.categories.includes(category)) ?? true,
    );
  }

  if (filters.tags?.length) {
    records = records.filter((record) =>
      filters.tags?.every((tag) => record.metadata.tags.includes(tag)) ?? true,
    );
  }

  if (typeof filters.difficultyMin === "number") {
    const min = filters.difficultyMin;
    records = records.filter((record) =>
      record.metadata.difficultyMax === undefined || record.metadata.difficultyMax >= min,
    );
  }

  if (typeof filters.difficultyMax === "number") {
    const max = filters.difficultyMax;
    records = records.filter((record) =>
      record.metadata.difficultyMin === undefined || record.metadata.difficultyMin <= max,
    );
  }

  if (query) {
    records = records.filter((record) =>
      buildSearchText({
        title: record.metadata.title,
        author: record.metadata.author,
        categories: record.metadata.categories,
        tags: record.metadata.tags,
      }).includes(query),
    );
  }

  records.sort((a, b) => (a.metadata.updatedAt < b.metadata.updatedAt ? 1 : -1));

  const total = records.length;
  const start = (page - 1) * pageSize;
  const items = records.slice(start, start + pageSize).map((record) => memoryCloneMetadata(record.metadata));

  return { items, total, page, pageSize };
}

async function memoryCreateDeck(
  deckInput: Deck,
  options: {
    coverUrl?: string;
    submittedBy?: string | null;
    status?: DeckStatus;
    rejectionReason?: string | null;
  } = {},
) {
  await memoryEnsureReady();
  const normalized = normalizeDeck(deckInput);
  const slug = memoryGenerateUniqueSlug(normalized.title);
  const jsonPath = `/decks/${slug}.json`;
  const sha256 = sha256FromString(JSON.stringify(normalized));
  const difficulty = computeDifficultyRange(normalized.words);
  const now = new Date().toISOString();
  const coverUrl =
    options.coverUrl && options.coverUrl.startsWith("https://")
      ? options.coverUrl
      : normalized.metadata.coverImage;
  const tags = normalized.metadata.categories ?? [];
  const hasModeration = Boolean(process.env.DECK_ADMIN_TOKEN?.length);
  const status = options.status ?? (hasModeration ? "pending" : "published");
  const rejectionReason =
    status === "rejected" ? options.rejectionReason?.trim() || undefined : undefined;

  const metadata: DeckMetadata = {
    id: randomUUID(),
    slug,
    title: normalized.title,
    author: normalized.author,
    language: normalized.language,
    difficultyMin: difficulty.min,
    difficultyMax: difficulty.max,
    categories: [...(normalized.metadata.categories ?? [])],
    wordClasses: [...(normalized.metadata.wordClasses ?? [])],
    wordCount: normalized.words.length,
    coverUrl: coverUrl ?? undefined,
    jsonPath,
    sha256,
    nsfw: normalized.allowNSFW,
    createdAt: now,
    updatedAt: now,
    submittedBy: options.submittedBy ?? null,
    description: undefined,
    tags: [...tags],
    sampleWords: normalized.words.slice(0, 12).map((word) => word.text),
    status,
    rejectionReason,
  };

  memoryStoreState.records.push({
    metadata,
    deck: {
      ...normalized,
      metadata: {
        ...normalized.metadata,
        coverImage: coverUrl ?? normalized.metadata.coverImage,
      },
    },
  });

  return metadata;
}

async function memoryGetDeckFacets(): Promise<DeckFacets> {
  await memoryEnsureReady();
  const languages = new Set<Deck["language"]>();
  const categories = new Set<string>();
  const tags = new Set<string>();
  let minDifficulty: number | undefined;
  let maxDifficulty: number | undefined;

  for (const record of memoryStoreState.records) {
    if (record.metadata.status !== "published") {
      continue;
    }

    languages.add(record.metadata.language);
    record.metadata.categories.forEach((category) => categories.add(category));
    record.metadata.tags.forEach((tag) => tags.add(tag));

    if (typeof record.metadata.difficultyMin === "number") {
      minDifficulty =
        minDifficulty === undefined
          ? record.metadata.difficultyMin
          : Math.min(minDifficulty, record.metadata.difficultyMin);
    }

    if (typeof record.metadata.difficultyMax === "number") {
      maxDifficulty =
        maxDifficulty === undefined
          ? record.metadata.difficultyMax
          : Math.max(maxDifficulty, record.metadata.difficultyMax);
    }
  }

  return {
    languages: Array.from(languages).sort(),
    categories: Array.from(categories).sort(),
    tags: Array.from(tags).sort(),
    difficultyMin: minDifficulty,
    difficultyMax: maxDifficulty,
  };
}

async function memoryListDeckSlugs(options: { statuses?: DeckStatus[] } = {}) {
  await memoryEnsureReady();
  const statuses = options.statuses?.length ? options.statuses : ["published"];
  let records = memoryStoreState.records.slice();
  if (statuses.length) {
    records = records.filter((record) => statuses.includes(record.metadata.status));
  }
  return records.map((record) => record.metadata.slug).sort();
}

async function memoryUpdateDeckStatus(
  slug: string,
  status: DeckStatus,
  options: { rejectionReason?: string | null } = {},
) {
  await memoryEnsureReady();
  const record = memoryStoreState.records.find((item) => item.metadata.slug === slug);
  if (!record) {
    return false;
  }

  record.metadata.status = status;
  record.metadata.updatedAt = new Date().toISOString();
  if (status === "rejected") {
    const reason = options.rejectionReason?.trim();
    record.metadata.rejectionReason = reason && reason.length ? reason : undefined;
  } else {
    record.metadata.rejectionReason = undefined;
  }

  return true;
}

export const memoryDeckStore: DeckStore = {
  listRecentDecks: memoryListRecentDecks,
  listAllDeckMetadata: memoryListAllDeckMetadata,
  getDeckBySlug: memoryGetDeckBySlug,
  searchDecks: memorySearchDecks,
  createDeck: memoryCreateDeck,
  getDeckFacets: memoryGetDeckFacets,
  listDeckSlugs: memoryListDeckSlugs,
  updateDeckStatus: memoryUpdateDeckStatus,
  resetForTests: async () => {
    memoryResetStore();
    await memoryEnsureReady();
  },
};
