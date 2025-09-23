import type { Deck } from "@/lib/deck-schema";

export type DeckStatus = "published" | "pending" | "rejected";

export interface DeckMetadata {
  id: string;
  slug: string;
  title: string;
  author: string;
  language: Deck["language"];
  difficultyMin?: number;
  difficultyMax?: number;
  categories: string[];
  wordClasses: string[];
  wordCount: number;
  coverUrl?: string;
  jsonPath: string;
  sha256: string;
  nsfw: boolean;
  createdAt: string;
  updatedAt: string;
  submittedBy?: string | null;
  description?: string;
  tags: string[];
  sampleWords: string[];
  status: DeckStatus;
  rejectionReason?: string;
}

export interface DeckRecord {
  metadata: DeckMetadata;
  deck: Deck;
}

export interface DeckFilters {
  query?: string;
  language?: Deck["language"];
  categories?: string[];
  tags?: string[];
  includeNSFW?: boolean;
  difficultyMin?: number;
  difficultyMax?: number;
  page?: number;
  pageSize?: number;
  statuses?: DeckStatus[];
}

export interface DeckSearchResult {
  items: DeckMetadata[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeckSeed {
  deck: Deck;
  slug?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  submittedBy?: string | null;
  status?: DeckStatus;
  rejectionReason?: string | null;
}

export interface DeckFacets {
  languages: Deck["language"][];
  categories: string[];
  tags: string[];
  difficultyMin?: number;
  difficultyMax?: number;
}

export interface DeckStore {
  listRecentDecks: (
    limit?: number,
    options?: { statuses?: DeckStatus[] },
  ) => Promise<DeckMetadata[]>;
  listAllDeckMetadata: (
    options?: { statuses?: DeckStatus[] },
  ) => Promise<DeckMetadata[]>;
  getDeckBySlug: (
    slug: string,
    options?: { includeUnpublished?: boolean; statuses?: DeckStatus[] },
  ) => Promise<DeckRecord | null>;
  searchDecks: (filters?: DeckFilters) => Promise<DeckSearchResult>;
  createDeck: (
    deck: Deck,
    options?: {
      coverUrl?: string;
      submittedBy?: string | null;
      status?: DeckStatus;
      rejectionReason?: string | null;
    },
  ) => Promise<DeckMetadata>;
  getDeckFacets: () => Promise<DeckFacets>;
  listDeckSlugs: (options?: { statuses?: DeckStatus[] }) => Promise<string[]>;
  updateDeckStatus: (
    slug: string,
    status: DeckStatus,
    options?: { rejectionReason?: string | null },
  ) => Promise<boolean>;
  resetForTests: () => Promise<void>;
}
