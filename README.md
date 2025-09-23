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

- Deck metadata and JSON payloads live in a MariaDB table managed by `src/lib/deck-store.ts`. The module normalises uploads with Zod, generates slugs, computes SHA-256 hashes, and issues SQL queries for search and pagination.
- `/api/decks` provides a JSON API for searching decks and uploading new ones. Uploads validate against the shared Zod schema and compute checksums before persisting the deck.
- `/decks/[slug].json` serves a canonical JSON file suitable for the Android app import flow (`alias://import?deck=...`).
- `/api/decks/validate` performs lightweight schema validation so clients can preflight decks before uploading.
- If you set `DECK_ADMIN_TOKEN`, uploads start as `pending` and require approval via the moderation API/UI. Without the token, decks publish immediately.

## Abuse protection

- Uploads are rate limited per IP. Configure `DECK_UPLOAD_RATE_LIMIT` (requests) and `DECK_UPLOAD_RATE_WINDOW_SECONDS` (window in seconds) to tune the limits. Provide `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` if you want distributed enforcement; otherwise a per-instance in-memory counter is used.
- Set `HCAPTCHA_SECRET_KEY` and `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` to require an hCaptcha challenge on the deck upload form. Leave them unset to disable the CAPTCHA entirely.

## Moderation

- Define `DECK_ADMIN_TOKEN` in your environment to enable review workflows.
- Visit `/<locale>/admin/decks` (for example `/en/admin/decks`) and enter the token to view pending submissions.
- Approve or reject decks directly from the admin screen—actions call `POST /api/decks/moderate` with the same token in the `X-Admin-Token` header.
- Requests that filter unpublished decks via `/api/decks?status=pending` also require the token. Published deck queries continue to work anonymously.

## Adding new decks

Seed decks live in `src/data/sample-decks.ts`. On first connection the MariaDB store creates its schema and inserts those demo decks, so the gallery and API have data immediately. Subsequent uploads are written directly to the `decks` table with their canonical JSON payload alongside metadata.

## Accessibility and performance

- Radix UI components and keyboard-focusable buttons ensure the gallery is navigable without a mouse.
- `next/image` handles responsive screenshots and cover art.
- Pages use ISR (`revalidate = 300`) so gallery updates appear without a full rebuild.

## SEO

- `sitemap.xml` lists localized marketing, gallery, upload, and deck detail URLs.
- `robots.txt` allows crawling and links back to the generated sitemap.

## Next steps

The current implementation focuses on UX and core persistence. To take it production-ready:

1. Move deck JSON blobs to object storage and keep MariaDB for metadata only.
2. Connect GitHub OAuth for moderation queues.
3. Extend translations if new locales are added.

## Docker

A production build together with a MariaDB instance can be started using Docker Compose:

```bash
# Build the image, start MariaDB, and serve the site on http://localhost:3000
docker compose up --build
```

The `web` service waits for the bundled MariaDB container, which exposes its data directory via the `db-data` volume. Update the `.env` or Compose environment variables if you need different credentials or an external database.
