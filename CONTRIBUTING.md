# Contributing

## Quick Start
- Clone and install: `npm ci` (or `pnpm i --frozen-lockfile`).
- Copy env: `cp .env.example .env` and fill values (GitHub OAuth, storage, DB, hCaptcha, Redis).
- Dev server: `npm run dev` → http://localhost:3000.
- Optional Docker: `docker compose up --build` (starts MariaDB + app).

## Tests & Linting
- Unit/integration: `npm test` (watch: `npm run test:watch`).
- E2E: `npm run test:e2e` (spawns server automatically).
- Lint: `npm run lint` and address findings before pushing.

## Pull Requests
- Branch names: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: imperative, concise; reference issues when relevant (e.g., `fix: handle empty slugs (#123)`).
- Checklist:
  - Clear description (what/why) and testing steps.
  - Screenshots/GIFs for UI changes.
  - Tests for new behavior or fixes.
  - Update docs and `.env.example` when config changes.

## Reference
- Repository Guidelines: see `AGENTS.md` for structure, style, and workflow details.
- Project README: see `README.md` for stack, storage, moderation, and Docker usage.

