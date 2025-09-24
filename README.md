# Alias community site

This repository contains the marketing and community portal for the Alias Android party game. It is built with Next.js 15 (App Router) and offers a deck gallery, detail pages with deep links, and an upload workflow for community-made decks.

## Tech stack

- **Framework**: Next.js App Router with Incremental Static Regeneration.
- **Styling**: Tailwind CSS 4 + custom CSS variables for a material-inspired look.
- **UI primitives**: Radix UI for accessible dropdowns, switches, and checkboxes.
- **Validation**: Zod schemas shared between the upload form and API route.
- **Internationalization**: [`next-intl`](https://next-intl.dev) with English and Russian localisations.
- **Data layer**: MariaDB-backed deck store with automatic schema setup and demo seed data.

## Available scripts

```bash
npm run dev       # Start the development server (http://localhost:3000)
npm run build     # Create a production build
npm run start     # Start the production server
npm run lint      # Run ESLint over the project
```

## Project structure

```
/src
  app
    [locale]            # Localised routes (/, /decks, /about, /decks/[slug], /decks/upload)
    api/decks           # Deck listing + upload API routes
    decks/[slug].json   # Public JSON endpoint for each deck
  components            # Shared UI (navigation, filters, deck cards, upload form)
  data                  # Seed decks used by the demo store
  i18n                  # Locale configuration and message loading helpers
  lib                   # Deck schema, store, hashing and utility helpers
```

## Internationalisation

`next-intl` powers all locale-aware routes. The middleware redirects `/` to the preferred locale (`/en` or `/ru`). Messages live in `src/messages/*.json`. Use the `useTranslations` hook (client) or `getTranslations` helper (server) to fetch namespaced strings.

## Deck workflow

- Deck metadata lives in MariaDB while normalised deck JSON blobs are uploaded to object storage via `src/lib/storage.ts`. The database keeps the returned public URL in the `json_path` column alongside SHA-256 hashes, search text, and moderation state.
- On startup the store backfills any legacy `deck_json` payloads into object storage before dropping the old column, so upgrading instances automatically migrate existing decks.
- `/api/decks` provides a JSON API for searching decks and uploading new ones. Uploads validate against the shared Zod schema and compute checksums before persisting the deck.
- `/decks/[slug].json` now streams each deck directly from the configured bucket/CDN and keeps public caching headers for the Android app import flow (`alias://import?deck=...`).
- `/api/decks/validate` performs lightweight schema validation so clients can preflight decks before uploading.
- If you configure moderator GitHub accounts via `DECK_ADMIN_GITHUB_LOGINS`, uploads from non-admin users start as `pending` and require approval via the moderation UI. Uploads from signed-in admins publish immediately.

## Storage configuration

The storage helper supports S3-compatible services (AWS S3, Cloudflare R2, MinIO, etc.) and Supabase Storage. Deck JSON files are stored under `<prefix>/<slug>.json`, where the prefix defaults to `decks`. Configure credentials through the following environment variables:

- `DECK_STORAGE_DRIVER`: Set to `s3`, `r2`, or `supabase`.
- `DECK_STORAGE_BUCKET`: Bucket or container that will hold deck JSON (`alias-decks` is a good default).
- `DECK_STORAGE_PREFIX`: Optional folder/prefix inside the bucket (defaults to `decks`).
- `DECK_STORAGE_PUBLIC_BASE_URL`: Base URL that exposes the bucket via HTTPS/CDN (for example `https://cdn.example.com`). Required for R2 and recommended for S3/Supabase.

### S3 / R2

Provide the standard access keys alongside the region. For R2 or other S3-compatible providers set a custom endpoint and, if necessary, force path-style requests.

- `DECK_STORAGE_S3_REGION`
- `DECK_STORAGE_S3_ACCESS_KEY_ID`
- `DECK_STORAGE_S3_SECRET_ACCESS_KEY`
- `DECK_STORAGE_S3_ENDPOINT` (optional for custom hosts such as `https://<account>.r2.cloudflarestorage.com`)
- `DECK_STORAGE_S3_FORCE_PATH_STYLE` (optional, set to `true` to avoid virtual-hosted URLs)

### Supabase Storage

Create a public bucket (for example `alias-decks`) and supply:

- `DECK_STORAGE_SUPABASE_URL`
- `DECK_STORAGE_SUPABASE_SERVICE_ROLE_KEY`

The helper uses the Supabase Storage API to upload decks and request a public URL. You can override the generated URL by setting `DECK_STORAGE_PUBLIC_BASE_URL` to a custom domain or CDN edge.

## Abuse protection

- Uploads are rate limited per IP. Configure `DECK_UPLOAD_RATE_LIMIT` (requests) and `DECK_UPLOAD_RATE_WINDOW_SECONDS` (window in seconds) to tune the limits. Provide `REDIS_URL` or host credentials (`REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASSWORD`) to enable distributed enforcement; otherwise a per-instance in-memory counter is used. Set `REDIS_PREFIX` if you need to namespace keys.
- Set `HCAPTCHA_SECRET_KEY` and `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` to require an hCaptcha challenge on the deck upload form. Leave them unset to disable the CAPTCHA entirely.

## Moderation

- Configure GitHub OAuth by setting the following environment variables:
  - `GITHUB_ID` and `GITHUB_SECRET`: credentials for your GitHub OAuth app.
  - `AUTH_SECRET`: a random string used to encrypt NextAuth sessions (generate with `openssl rand -base64 32`).
  - `DECK_ADMIN_GITHUB_LOGINS`: comma-separated GitHub usernames that should have moderation access.
- Visit `/<locale>/admin/decks` (for example `/en/admin/decks`) and sign in with GitHub to view pending submissions.
- Approve or reject decks directly from the admin screen—requests are authenticated with the signed-in session.
- Admin-only filters such as `/api/decks?status=pending` and `/api/decks/moderate` require an authenticated moderator. Published deck queries continue to work anonymously.

## Adding new decks

Seed decks live in `src/data/sample-decks.ts`. On first connection the MariaDB store creates its schema and inserts those demo decks, uploading their JSON blobs to the configured storage bucket so the gallery and API have data immediately. Subsequent uploads follow the same flow—metadata lands in MariaDB while the normalised deck file is pushed to object storage.

## Accessibility and performance

- Radix UI components and keyboard-focusable buttons ensure the gallery is navigable without a mouse.
- `next/image` handles responsive screenshots and cover art.
- Pages use ISR (`revalidate = 300`) so gallery updates appear without a full rebuild.

## SEO

- `sitemap.xml` lists localized marketing, gallery, upload, and deck detail URLs.
- `robots.txt` allows crawling and links back to the generated sitemap.

## Docker

### Basic setup (Database only)

A production build together with a MariaDB instance can be started using Docker Compose:

```bash
# Build the image, start MariaDB, and serve the site on http://localhost:3000
docker compose up --build
```

The `web` service waits for the bundled MariaDB container, which exposes its data directory via the `db-data` volume. Update the `.env` or Compose environment variables if you need different credentials or an external database.

### Full setup (Database + MinIO + Valkey)

For a complete self-contained setup with object storage and caching, use the `docker-compose.full.yml` file:

```bash
# Build the image and start all services: MariaDB, MinIO (S3-compatible storage), Valkey (Redis-compatible cache), and the web app
docker compose -f docker-compose.full.yml up --build
```

This setup includes:

- **MariaDB**: Database for deck metadata and user sessions
- **MinIO**: S3-compatible object storage for deck JSON files (accessible at http://localhost:9000, console at http://localhost:9001)
- **Valkey**: Redis-compatible cache for rate limiting and session storage
- **Web app**: The Next.js application with all dependencies

The `.env.example` file is pre-configured to work with this setup. Copy it to `.env` and the application will automatically connect to the local services.

#### Service URLs
- **Web app**: http://localhost:3000
- **MinIO API**: http://localhost:9000
- **MinIO Console**: http://localhost:9001 (login: `minioadmin` / `miniopass`)
- **MariaDB**: localhost:3306
- **Valkey**: localhost:6379
