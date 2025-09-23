import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Deck } from "@/lib/deck-schema";

export interface DeckStorageLocation {
  key: string;
  url: string;
}

type StorageDriver = "s3" | "r2" | "supabase";

let cachedDriver: StorageDriver | null = null;
let s3Client: S3Client | null = null;
let supabaseClient: SupabaseClient | null = null;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function resolveDriver(): StorageDriver {
  if (cachedDriver) {
    return cachedDriver;
  }

  const raw = process.env.DECK_STORAGE_DRIVER?.toLowerCase();
  if (!raw) {
    throw new Error(
      "DECK_STORAGE_DRIVER must be set to 's3', 'r2', or 'supabase' to upload deck JSON.",
    );
  }

  if (raw !== "s3" && raw !== "r2" && raw !== "supabase") {
    throw new Error(`Unsupported deck storage driver: ${raw}`);
  }

  cachedDriver = raw;
  return cachedDriver;
}

function getBucketName(): string {
  return requireEnv("DECK_STORAGE_BUCKET");
}

function getStoragePrefix(): string {
  const prefix = process.env.DECK_STORAGE_PREFIX;
  if (!prefix) {
    return "decks";
  }
  return prefix.replace(/^\/+|\/+$|\s+/g, "");
}

function buildObjectKey(slug: string): string {
  const normalizedSlug = slug.replace(/^\/+|\.json$/g, "");
  const prefix = getStoragePrefix();
  return prefix ? `${prefix}/${normalizedSlug}.json` : `${normalizedSlug}.json`;
}

function joinUrl(base: string, key: string): string {
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedKey = key.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedKey}`;
}

function resolveS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const region = requireEnv("DECK_STORAGE_S3_REGION");
  const accessKeyId = requireEnv("DECK_STORAGE_S3_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("DECK_STORAGE_S3_SECRET_ACCESS_KEY");
  const endpoint = process.env.DECK_STORAGE_S3_ENDPOINT;
  const driver = resolveDriver();
  const forcePathStyle =
    driver === "r2" || endpoint !== undefined || process.env.DECK_STORAGE_S3_FORCE_PATH_STYLE === "true";

  s3Client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
}

function resolveSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = requireEnv("DECK_STORAGE_SUPABASE_URL");
  const serviceRoleKey = requireEnv("DECK_STORAGE_SUPABASE_SERVICE_ROLE_KEY");

  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return supabaseClient;
}

function resolvePublicUrl(driver: StorageDriver, key: string, bucket: string): string {
  const base = process.env.DECK_STORAGE_PUBLIC_BASE_URL;
  if (base) {
    return joinUrl(base, key);
  }

  if (driver === "s3") {
    const region = requireEnv("DECK_STORAGE_S3_REGION");
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  throw new Error(
    "Set DECK_STORAGE_PUBLIC_BASE_URL to compute deck JSON URLs for the configured storage provider.",
  );
}

export function getDeckStorageKey(slug: string) {
  return buildObjectKey(slug);
}

export async function uploadDeckJson(slug: string, deck: Deck): Promise<DeckStorageLocation> {
  const driver = resolveDriver();
  const bucket = getBucketName();
  const key = buildObjectKey(slug);
  const body = Buffer.from(JSON.stringify(deck));

  if (driver === "s3" || driver === "r2") {
    const client = resolveS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "application/json",
        CacheControl: "public, max-age=3600",
      }),
    );

    const url = resolvePublicUrl(driver, key, bucket);
    return { key, url };
  }

  const client = resolveSupabaseClient();
  const { error } = await client.storage.from(bucket).upload(key, body, {
    upsert: true,
    cacheControl: "3600",
    contentType: "application/json",
  });

  if (error) {
    throw new Error(`Failed to upload deck JSON to Supabase Storage: ${error.message}`);
  }

  const base = process.env.DECK_STORAGE_PUBLIC_BASE_URL;
  if (base) {
    return { key, url: joinUrl(base, key) };
  }

  const { data } = client.storage.from(bucket).getPublicUrl(key);
  if (!data?.publicUrl) {
    throw new Error("Supabase Storage did not return a public URL for the uploaded deck JSON.");
  }

  return { key, url: data.publicUrl };
}

export async function fetchDeckJson(url: string): Promise<Deck> {
  if (!url) {
    throw new Error("Deck storage URL is not defined.");
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch deck JSON from ${url} (status ${response.status}).`,
    );
  }

  return (await response.json()) as Deck;
}
