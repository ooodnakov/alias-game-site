# Repository Guidelines

## Project Structure & Module Organization
Core app code lives under `src/app`, with localized routes in `[locale]` and API handlers in `api/decks`. Shared UI components are in `src/components` and `src/components/ui`, while domain helpers reside in `src/lib` (deck schema, storage, hashing) and sample data in `src/data`. Localization assets sit in `src/messages` and `src/i18n`, and static files go in `public/`. Tests are grouped under `tests/` with Playwright specs in `tests/e2e/` and setup utilities in `tests/setup/`.

## Build, Test, and Development Commands
Use `pnpm run dev` for the Next.js dev server at http://localhost:3000. Run `pnpm run build` to produce a production bundle and `pnpm start` to serve it. Execute `pnpm run lint` to apply the Next.js + TypeScript ESLint rules. Validate unit and integration coverage with `pnpm test` (or `pnpm run test:watch` locally), and drive Playwright end-to-end checks with `pnpm run test:e2e`.

## Coding Style & Naming Conventions
Write strict TypeScript with 2-space indentation and Tailwind utilities scoped to their components. Export components in PascalCase and name hooks in camelCase (`useDeckStore`). Files and routes should stay in kebab-case (`deck-upload-form.tsx`). Prefer `@/` imports for modules under `src`. Use Zod for runtime validation and keep modules focused with no unused exports.

## Testing Guidelines
Vitest powers unit and integration tests (`tests/**/*.test.ts`), while Playwright covers flows across pages. Apply the shared reset helper in `tests/setup/setup-tests.ts` when state is involved. Maintain meaningful describe/it titles to document behavior. Coverage uses the V8 provider—prioritize `src/lib` utilities and API routes before merging.

## Commit & Pull Request Guidelines
Write imperative commit subjects under 72 characters (e.g., `fix: normalize deck payload`). Reference issues with `#123` when relevant. Pull requests should summarize intent, list testing performed, and include screenshots or GIFs for UI changes. Call out config or migration impacts and update docs or `.env.example` whenever environment requirements shift.

## Security & Configuration Tips
Never commit secrets; start by copying `.env.example` and filling the keys for GitHub OAuth, storage, hCaptcha, Redis, and the DB. Local development can rely on `docker compose up --build` for MariaDB plus the web app. Prefer CDN or public URLs for deck JSON and consult the README for moderation and storage configuration details.
