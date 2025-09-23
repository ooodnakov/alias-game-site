import { randomUUID } from "node:crypto";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { sampleDeckSeeds } from "@/data/sample-decks";
import { DeckSchema, type Deck } from "@/lib/deck-schema";
import { getDatabasePool } from "@/lib/db";
import { sha256FromString } from "@/lib/hash";
import { createSlug } from "@/lib/slug";
import { fetchDeckJson, uploadDeckJson } from "@/lib/storage";

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

interface DeckMetadataRow extends RowDataPacket {
  id: string;
  slug: string;
  title: string;
  author: string;
  language: Deck["language"];
  difficulty_min: number | null;
  difficulty_max: number | null;
  categories: string | null;
  word_classes: string | null;
  word_count: number;
  cover_url: string | null;
  json_path: string;
  sha256: string;
  nsfw: number;
  created_at: string;
  updated_at: string;
  submitted_by: string | null;
  description: string | null;
  tags: string | null;
  sample_words: string | null;
  status: DeckStatus;
  rejection_reason: string | null;
}

interface LegacyDeckRow extends RowDataPacket {
  id: string;
  slug: string;
  deck_json: string | null;
  json_path: string | null;
}

let initPromise: Promise<void> | null = null;

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
    }
  }

  return [];
}

function normalizeDeck(deckInput: Deck): Deck {
  const base = DeckSchema.parse(deckInput);
  const words: Deck["words"] = [];
  const seen = new Set<string>();

  for (const word of base.words) {
    const text = word.text.trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push({
      ...word,
      text,
      category: word.category?.trim() || undefined,
      wordClass: word.wordClass?.trim() || undefined,
    });
  }

  const categories = Array.from(
    new Set((base.metadata.categories ?? []).map((item) => item.trim()).filter(Boolean)),
  );

  const wordClasses = Array.from(
    new Set((base.metadata.wordClasses ?? []).map((item) => item.trim()).filter(Boolean)),
  );

  const normalized: Deck = {
    ...base,
    title: base.title.trim(),
    author: base.author.trim(),
    allowNSFW: base.allowNSFW ?? false,
    metadata: {
      ...base.metadata,
      categories,
      wordClasses,
      coverImage: base.metadata.coverImage,
    },
    words,
  };

  return normalized;
}

function computeDifficultyRange(words: Deck["words"]) {
  const difficulties = words
    .map((word) => word.difficulty)
    .filter((value): value is number => typeof value === "number");

  if (!difficulties.length) {
    return { min: undefined, max: undefined };
  }

  return {
    min: Math.min(...difficulties),
    max: Math.max(...difficulties),
  };
}

function buildSearchText(metadata: {
  title: string;
  author: string;
  categories: string[];
  tags: string[];
}) {
  return [metadata.title, metadata.author, ...metadata.categories, ...metadata.tags]
    .map((item) => item.toLowerCase())
    .join(" ");
}

function mapRowToMetadata(row: DeckMetadataRow): DeckMetadata {
  const categories = parseStringArray(row.categories);
  const wordClasses = parseStringArray(row.word_classes);
  const tags = parseStringArray(row.tags);
  const sampleWords = parseStringArray(row.sample_words);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    language: row.language,
    difficultyMin: row.difficulty_min ?? undefined,
    difficultyMax: row.difficulty_max ?? undefined,
    categories,
    wordClasses,
    wordCount: row.word_count,
    coverUrl: row.cover_url ?? undefined,
    jsonPath: row.json_path,
    sha256: row.sha256,
    nsfw: Boolean(row.nsfw),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedBy: row.submitted_by,
    description: row.description ?? undefined,
    tags,
    sampleWords,
    status: row.status,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

async function ensureSchema() {
  const pool = getDatabasePool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS decks (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      slug VARCHAR(191) NOT NULL UNIQUE,
      title VARCHAR(191) NOT NULL,
      author VARCHAR(191) NOT NULL,
      language VARCHAR(10) NOT NULL,
      difficulty_min INT NULL,
      difficulty_max INT NULL,
      categories JSON NOT NULL,
      word_classes JSON NOT NULL,
      word_count INT NOT NULL,
      cover_url TEXT NULL,
      json_path TEXT NOT NULL,
      sha256 CHAR(64) NOT NULL,
      nsfw TINYINT(1) NOT NULL DEFAULT 0,
      created_at VARCHAR(32) NOT NULL,
      updated_at VARCHAR(32) NOT NULL,
      submitted_by VARCHAR(255) NULL,
      description TEXT NULL,
      tags JSON NOT NULL,
      sample_words JSON NOT NULL,
      search_text TEXT NOT NULL,
      status ENUM('published', 'pending', 'rejected') NOT NULL DEFAULT 'published',
      rejection_reason TEXT NULL,
      INDEX idx_decks_language (language),
      INDEX idx_decks_updated_at (updated_at),
      INDEX idx_decks_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool
    .query(
      "ALTER TABLE decks ADD COLUMN status ENUM('published','pending','rejected') NOT NULL DEFAULT 'published'",
    )
    .catch(() => {});
  await pool
    .query("ALTER TABLE decks ADD COLUMN rejection_reason TEXT NULL")
    .catch(() => {});
  await pool.query("ALTER TABLE decks ADD INDEX idx_decks_status (status)").catch(() => {});
  await pool
    .query("ALTER TABLE decks MODIFY COLUMN json_path TEXT NOT NULL")
    .catch(() => {});
}

async function slugExists(slug: string) {
  const pool = getDatabasePool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT 1 FROM decks WHERE slug = :slug LIMIT 1",
    { slug },
  );
  return rows.length > 0;
}

async function generateUniqueSlug(title: string) {
  let base = createSlug(title);
  if (!base) {
    base = `deck-${Date.now()}`;
  }

  let candidate = base;
  let attempt = 1;

  while (await slugExists(candidate)) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }

  return candidate;
}

async function seedDatabase() {
  const pool = getDatabasePool();
  const [counts] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM decks",
  );
  const total = Number(counts[0]?.total ?? 0);
  if (total > 0) {
    return;
  }

  for (const seed of sampleDeckSeeds) {
    const normalized = normalizeDeck(seed.deck);
    const slug = seed.slug ? createSlug(seed.slug) : await generateUniqueSlug(normalized.title);
    const finalSlug = slug || (await generateUniqueSlug(normalized.title));

    if (await slugExists(finalSlug)) {
      continue;
    }
    const storage = await uploadDeckJson(finalSlug, normalized);
    const sha256 = sha256FromString(JSON.stringify(normalized));
    const difficulty = computeDifficultyRange(normalized.words);
    const status = seed.status ?? "published";
    const rejectionReason =
      status === "rejected"
        ? seed.rejectionReason?.trim() || null
        : null;

    const metadata: DeckMetadata = {
      id: randomUUID(),
      slug: finalSlug,
      title: normalized.title,
      author: normalized.author,
      language: normalized.language,
      difficultyMin: difficulty.min,
      difficultyMax: difficulty.max,
      categories: normalized.metadata.categories ?? [],
      wordClasses: normalized.metadata.wordClasses ?? [],
      wordCount: normalized.words.length,
      coverUrl: normalized.metadata.coverImage,
      jsonPath: storage.url,
      sha256,
      nsfw: normalized.allowNSFW,
      createdAt: seed.createdAt,
      updatedAt: seed.updatedAt,
      submittedBy: seed.submittedBy ?? null,
      description: seed.description,
      tags: seed.tags ?? normalized.metadata.categories ?? [],
      sampleWords: normalized.words.slice(0, 12).map((word) => word.text),
      status,
      rejectionReason: rejectionReason ?? undefined,
    };

    await pool.execute(
      `INSERT INTO decks (
        id,
        slug,
        title,
        author,
        language,
        difficulty_min,
        difficulty_max,
        categories,
        word_classes,
        word_count,
        cover_url,
        json_path,
        sha256,
        nsfw,
        created_at,
        updated_at,
        submitted_by,
        description,
        tags,
        sample_words,
        search_text,
        status,
        rejection_reason
      ) VALUES (
        :id,
        :slug,
        :title,
        :author,
        :language,
        :difficulty_min,
        :difficulty_max,
        :categories,
        :word_classes,
        :word_count,
        :cover_url,
        :json_path,
        :sha256,
        :nsfw,
        :created_at,
        :updated_at,
        :submitted_by,
        :description,
        :tags,
        :sample_words,
        :search_text,
        :status,
        :rejection_reason
      )`,
      {
        id: metadata.id,
        slug: metadata.slug,
        title: metadata.title,
        author: metadata.author,
        language: metadata.language,
        difficulty_min: metadata.difficultyMin ?? null,
        difficulty_max: metadata.difficultyMax ?? null,
        categories: JSON.stringify(metadata.categories),
        word_classes: JSON.stringify(metadata.wordClasses),
        word_count: metadata.wordCount,
        cover_url: metadata.coverUrl ?? null,
        json_path: metadata.jsonPath,
        sha256: metadata.sha256,
        nsfw: metadata.nsfw ? 1 : 0,
        created_at: metadata.createdAt,
        updated_at: metadata.updatedAt,
        submitted_by: metadata.submittedBy ?? null,
        description: metadata.description ?? null,
        tags: JSON.stringify(metadata.tags),
        sample_words: JSON.stringify(metadata.sampleWords),
        search_text: buildSearchText({
          title: metadata.title,
          author: metadata.author,
          categories: metadata.categories,
          tags: metadata.tags,
        }),
        status: metadata.status,
        rejection_reason: rejectionReason,
    },
    );
  }
}


async function backfillLegacyDeckBlobs() {
  const pool = getDatabasePool();
  const [columns] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM decks LIKE 'deck_json'");
  if (!columns.length) {
    return;
  }

  const [rows] = await pool.query<LegacyDeckRow[]>(
    `SELECT id, slug, deck_json, json_path
     FROM decks
     WHERE deck_json IS NOT NULL
       AND (json_path IS NULL OR json_path = '' OR json_path NOT LIKE 'http%')`,
  );

  for (const row of rows) {
    if (!row.deck_json) {
      continue;
    }

    let deck: Deck;
    try {
      deck = JSON.parse(row.deck_json) as Deck;
    } catch (error) {
      throw new Error(`Failed to parse legacy deck JSON for slug "${row.slug}": ${error}`);
    }

    const storage = await uploadDeckJson(row.slug, deck);
    await pool.execute(
      `UPDATE decks SET json_path = :json_path WHERE id = :id`,
      {
        json_path: storage.url,
        id: row.id,
      },
    );
  }
}

async function dropLegacyDeckJsonColumn() {
  const pool = getDatabasePool();
  const [columns] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM decks LIKE 'deck_json'");
  if (!columns.length) {
    return;
  }

  await pool.query("ALTER TABLE decks DROP COLUMN deck_json").catch(() => {});
}

async function ensureReady() {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureSchema();
      await backfillLegacyDeckBlobs();
      await seedDatabase();
      await dropLegacyDeckJsonColumn();
    })();
  }

  await initPromise;
}

export async function listRecentDecks(limit = 6, options: { statuses?: DeckStatus[] } = {}) {
  await ensureReady();
  const pool = getDatabasePool();
  const statuses = options.statuses?.length ? options.statuses : ["published"];
  const params: Record<string, unknown> = { limit };
  let whereClause = "";
  if (statuses.length) {
    const placeholders = statuses.map((_, index) => `:status${index}`);
    whereClause = `WHERE status IN (${placeholders.join(", ")})`;
    statuses.forEach((status, index) => {
      params[`status${index}`] = status;
    });
  }

  const [rows] = await pool.query<DeckMetadataRow[]>(
    `SELECT * FROM decks ${whereClause} ORDER BY updated_at DESC LIMIT :limit`,
    params,
  );
  return rows.map((row) => mapRowToMetadata(row));
}

export async function listAllDeckMetadata(options: { statuses?: DeckStatus[] } = {}) {
  await ensureReady();
  const pool = getDatabasePool();
  const statuses = options.statuses?.length ? options.statuses : ["published"];
  const params: Record<string, unknown> = {};
  let whereClause = "";
  if (statuses.length) {
    const placeholders = statuses.map((_, index) => `:status${index}`);
    whereClause = `WHERE status IN (${placeholders.join(", ")})`;
    statuses.forEach((status, index) => {
      params[`status${index}`] = status;
    });
  }

  const [rows] = await pool.query<DeckMetadataRow[]>(
    `SELECT * FROM decks ${whereClause} ORDER BY updated_at DESC`,
    params,
  );
  return rows.map((row) => mapRowToMetadata(row));
}

export async function getDeckMetadataBySlug(
  slug: string,
  options: { includeUnpublished?: boolean; statuses?: DeckStatus[] } = {},
) {
  await ensureReady();
  const pool = getDatabasePool();
  const params: Record<string, unknown> = { slug };
  let query = `SELECT * FROM decks WHERE slug = :slug`;

  if (!options.includeUnpublished) {
    const statuses = options.statuses?.length ? options.statuses : ["published"];
    if (statuses.length) {
      const placeholders = statuses.map((_, index) => `:status${index}`);
      query += ` AND status IN (${placeholders.join(", ")})`;
      statuses.forEach((status, index) => {
        params[`status${index}`] = status;
      });
    }
  }

  query += ` LIMIT 1`;

  const [rows] = await pool.query<DeckMetadataRow[]>(query, params);
  if (!rows.length) {
    return null;
  }
  return mapRowToMetadata(rows[0]);
}

export async function getDeckBySlug(
  slug: string,
  options: { includeUnpublished?: boolean; statuses?: DeckStatus[] } = {},
) {
  const metadata = await getDeckMetadataBySlug(slug, options);
  if (!metadata) {
    return null;
  }

  try {
    const deck = await fetchDeckJson(metadata.jsonPath);
    return { metadata, deck };
  } catch (error) {
    console.error(`Failed to fetch deck JSON for slug "${slug}":`, error);
    return null;
  }
}

export async function searchDecks(filters: DeckFilters = {}): Promise<DeckSearchResult> {
  await ensureReady();
  const pool = getDatabasePool();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(30, filters.pageSize ?? 12));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  const statuses = filters.statuses?.length ? filters.statuses : ["published"];
  if (statuses.length) {
    const placeholders = statuses.map((_, index) => `:status${index}`);
    conditions.push(`status IN (${placeholders.join(", ")})`);
    statuses.forEach((status, index) => {
      params[`status${index}`] = status;
    });
  }

  if (!filters.includeNSFW) {
    conditions.push("nsfw = 0");
  }

  if (filters.language) {
    conditions.push("language = :language");
    params.language = filters.language;
  }

  if (filters.query) {
    conditions.push("search_text LIKE :query");
    params.query = `%${filters.query.toLowerCase()}%`;
  }

  if (filters.categories?.length) {
    filters.categories.forEach((category, index) => {
      const key = `category${index}`;
      conditions.push(`JSON_CONTAINS(categories, JSON_QUOTE(:${key}))`);
      params[key] = category;
    });
  }

  if (filters.tags?.length) {
    filters.tags.forEach((tag, index) => {
      const key = `tag${index}`;
      conditions.push(`JSON_CONTAINS(tags, JSON_QUOTE(:${key}))`);
      params[key] = tag;
    });
  }

  if (typeof filters.difficultyMin === "number") {
    conditions.push("(difficulty_max IS NULL OR difficulty_max >= :difficultyMin)");
    params.difficultyMin = filters.difficultyMin;
  }

  if (typeof filters.difficultyMax === "number") {
    conditions.push("(difficulty_min IS NULL OR difficulty_min <= :difficultyMax)");
    params.difficultyMax = filters.difficultyMax;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM decks ${whereClause}`,
    params,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const [rows] = await pool.query<DeckMetadataRow[]>(
    `SELECT * FROM decks ${whereClause} ORDER BY updated_at DESC LIMIT :limit OFFSET :offset`,
    { ...params, limit: pageSize, offset },
  );

  return {
    items: rows.map((row) => mapRowToMetadata(row)),
    total,
    page,
    pageSize,
  };
}

export async function createDeck(
  deckInput: Deck,
  options: {
    coverUrl?: string;
    submittedBy?: string | null;
    status?: DeckStatus;
    rejectionReason?: string | null;
  } = {},
) {
  await ensureReady();
  const pool = getDatabasePool();
  const normalized = normalizeDeck(deckInput);
  const slug = await generateUniqueSlug(normalized.title);
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
    status === "rejected"
      ? options.rejectionReason?.trim() || null
      : null;

  const deckForStorage: Deck = {
    ...normalized,
    metadata: {
      ...normalized.metadata,
      coverImage: coverUrl ?? normalized.metadata.coverImage,
    },
  };
  const sha256 = sha256FromString(JSON.stringify(deckForStorage));
  const storage = await uploadDeckJson(slug, deckForStorage);

  const metadata: DeckMetadata = {
    id: randomUUID(),
    slug,
    title: normalized.title,
    author: normalized.author,
    language: normalized.language,
    difficultyMin: difficulty.min,
    difficultyMax: difficulty.max,
    categories: normalized.metadata.categories ?? [],
    wordClasses: normalized.metadata.wordClasses ?? [],
    wordCount: normalized.words.length,
    coverUrl: coverUrl ?? undefined,
    jsonPath: storage.url,
    sha256,
    nsfw: normalized.allowNSFW,
    createdAt: now,
    updatedAt: now,
    submittedBy: options.submittedBy ?? null,
    description: undefined,
    tags,
    sampleWords: normalized.words.slice(0, 12).map((word) => word.text),
    status,
    rejectionReason: rejectionReason ?? undefined,
  };

  await pool.execute(
    `INSERT INTO decks (
      id,
      slug,
      title,
      author,
      language,
      difficulty_min,
      difficulty_max,
      categories,
      word_classes,
      word_count,
      cover_url,
      json_path,
      sha256,
      nsfw,
      created_at,
      updated_at,
      submitted_by,
      description,
      tags,
      sample_words,
      search_text,
      status,
      rejection_reason
    ) VALUES (
      :id,
      :slug,
      :title,
      :author,
      :language,
      :difficulty_min,
      :difficulty_max,
      :categories,
      :word_classes,
      :word_count,
      :cover_url,
      :json_path,
      :sha256,
      :nsfw,
      :created_at,
      :updated_at,
      :submitted_by,
      :description,
      :tags,
      :sample_words,
      :search_text,
      :status,
      :rejection_reason
    )`,
    {
      id: metadata.id,
      slug: metadata.slug,
      title: metadata.title,
      author: metadata.author,
      language: metadata.language,
      difficulty_min: metadata.difficultyMin ?? null,
      difficulty_max: metadata.difficultyMax ?? null,
      categories: JSON.stringify(metadata.categories),
      word_classes: JSON.stringify(metadata.wordClasses),
      word_count: metadata.wordCount,
      cover_url: metadata.coverUrl ?? null,
      json_path: metadata.jsonPath,
      sha256: metadata.sha256,
      nsfw: metadata.nsfw ? 1 : 0,
      created_at: metadata.createdAt,
      updated_at: metadata.updatedAt,
      submitted_by: metadata.submittedBy ?? null,
      description: metadata.description ?? null,
      tags: JSON.stringify(metadata.tags),
      sample_words: JSON.stringify(metadata.sampleWords),
      search_text: buildSearchText({
        title: metadata.title,
        author: metadata.author,
        categories: metadata.categories,
        tags: metadata.tags,
      }),
      status: metadata.status,
      rejection_reason: rejectionReason,
    },
  );

  return metadata;
}

export async function getDeckFacets(): Promise<DeckFacets> {
  await ensureReady();
  const pool = getDatabasePool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT language, categories, tags, difficulty_min, difficulty_max FROM decks WHERE status = 'published'`,
  );

  const languages = new Set<Deck["language"]>();
  const categories = new Set<string>();
  const tags = new Set<string>();
  let minDifficulty: number | undefined;
  let maxDifficulty: number | undefined;

  for (const row of rows) {
    if (row.language) {
      languages.add(row.language as Deck["language"]);
    }
    parseStringArray(row.categories).forEach((category) => categories.add(category));
    parseStringArray(row.tags).forEach((tag) => tags.add(tag));
    if (typeof row.difficulty_min === "number") {
      minDifficulty =
        minDifficulty === undefined
          ? row.difficulty_min
          : Math.min(minDifficulty, row.difficulty_min);
    }
    if (typeof row.difficulty_max === "number") {
      maxDifficulty =
        maxDifficulty === undefined
          ? row.difficulty_max
          : Math.max(maxDifficulty, row.difficulty_max);
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

export async function listDeckSlugs(options: { statuses?: DeckStatus[] } = {}) {
  await ensureReady();
  const pool = getDatabasePool();
  const statuses = options.statuses?.length ? options.statuses : ["published"];
  const params: Record<string, unknown> = {};
  let whereClause = "";
  if (statuses.length) {
    const placeholders = statuses.map((_, index) => `:status${index}`);
    whereClause = `WHERE status IN (${placeholders.join(", ")})`;
    statuses.forEach((status, index) => {
      params[`status${index}`] = status;
    });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT slug FROM decks ${whereClause} ORDER BY slug ASC`,
    params,
  );
  return rows.map((row) => String(row.slug));
}

export async function updateDeckStatus(
  slug: string,
  status: DeckStatus,
  options: { rejectionReason?: string | null } = {},
) {
  await ensureReady();
  const pool = getDatabasePool();
  const rejectionReason =
    status === "rejected"
      ? options.rejectionReason?.trim() || null
      : null;
  const updatedAt = new Date().toISOString();

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE decks
     SET status = :status,
         rejection_reason = :rejection_reason,
         updated_at = :updated_at
     WHERE slug = :slug`,
    {
      status,
      rejection_reason: rejectionReason,
      updated_at: updatedAt,
      slug,
    },
  );

  return (result as ResultSetHeader).affectedRows > 0;
}
