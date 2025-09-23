# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router (localized routes under `[locale]`, API under `api/decks`).
- `src/components` and `src/components/ui`: reusable UI (export components in PascalCase).
- `src/lib`: deck schema, store, hashing, storage helpers.
- `src/data`: demo/seed decks; `src/messages` and `src/i18n`: localization.
- `tests/`: unit, integration, and `e2e/` Playwright specs; `tests/setup` config.
- `public/`: static assets. Docker files: `Dockerfile`, `docker-compose.yml` for local DB + app.

## Build, Test, and Development Commands
- `pnpm run dev`: start dev server (http://localhost:3000).
- `pnpm run build`: create production build; `pnpm start`: serve build.
- `pnpm run lint`: run ESLint (Next.js + TypeScript rules).
- `pnpm test` / `pnpm run test:watch`: run Vitest unit/integration tests.
- `pnpm run test:e2e`: run Playwright e2e; auto-spawns a dev server.
- Docker: `docker compose up --build` runs MariaDB + web with hot-reload.

## Coding Style & Naming Conventions
- TypeScript (strict); follow ESLint config (`next/core-web-vitals`, `next/typescript`).
- Filenames: kebab-case (`deck-upload-form.tsx`, `admin-deck-moderation.tsx`).
- Component names: PascalCase exports; hooks in camelCase (`useXyz`).
- Routes/API folders: kebab-case. Use `@/` alias for imports from `src`.
- Tailwind CSS utilities; keep styles local to components. Prefer Zod for runtime validation.
- Indentation: 2 spaces; no unused vars/exports; keep modules focused.

## Testing Guidelines
- Frameworks: Vitest (`tests/**/*.test.ts`) and Playwright (`tests/e2e/**`).
- Setup: shared reset in `tests/setup/setup-tests.ts` (deck store state).
- Run: `pnpm test` locally; add e2e where flows cross pages.
- Coverage: V8 provider enabled; prioritize `src/lib` and API routes.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subjects (<72 chars). Optional scope (e.g., "refactor: deck store init"). Reference issues (`#123`) when applicable.
- PRs: clear summary (what/why), testing steps, screenshots/GIFs for UI, linked issues. Note config/migration changes and update docs or `.env.example` as needed.
- Keep diffs focused; include tests for bug fixes and new behavior.

## Security & Configuration Tips
- Do not commit secrets. Copy `.env.example` to `.env` and fill required variables (GitHub OAuth, storage S3/R2/Supabase, hCaptcha, Redis, DB).
- Local DB via `docker-compose.yml`; tests can use in-memory store (`ALIAS_TEST_DB=memory`).
- Follow README for storage and moderation configuration; prefer CDN/public URLs for deck JSON.

