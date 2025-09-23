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
- If you configure moderator GitHub accounts via `DECK_ADMIN_GITHUB_LOGINS`, uploads from non-admin users start as `pending` and require approval via the moderation UI. Uploads from signed-in admins publish immediately.

## Moderation

- Configure GitHub OAuth by setting the following environment variables:
  - `GITHUB_ID` and `GITHUB_SECRET`: credentials for your GitHub OAuth app.
  - `AUTH_SECRET`: a random string used to encrypt NextAuth sessions (generate with `openssl rand -base64 32`).
  - `DECK_ADMIN_GITHUB_LOGINS`: comma-separated GitHub usernames that should have moderation access.
- Visit `/<locale>/admin/decks` (for example `/en/admin/decks`) and sign in with GitHub to view pending submissions.
- Approve or reject decks directly from the admin screen—requests are authenticated with the signed-in session.
- Admin-only filters such as `/api/decks?status=pending` and `/api/decks/moderate` require an authenticated moderator. Published deck queries continue to work anonymously.

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
2. Add rate limiting and optional CAPTCHA to `/api/decks`.
3. Connect GitHub OAuth for moderation queues.
4. Extend translations if new locales are added.

## Docker

A production build together with a MariaDB instance can be started using Docker Compose:

```bash
# Build the image, start MariaDB, and serve the site on http://localhost:3000
docker compose up --build
```

The `web` service waits for the bundled MariaDB container, which exposes its data directory via the `db-data` volume. Update the `.env` or Compose environment variables if you need different credentials or an external database.
