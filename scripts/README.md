# Scripts

Utility scripts that keep the community resources in sync with the app. Run them with Node 20+ from the repository root.

## Starter kit generator

```
node scripts/starter-kit/generate.mjs
```

This script rebuilds the downloadable assets that power the deck creation starter kit on the upload page:

- `public/starter-kit/deck-template.json`
- `public/starter-kit/cover-template-dark.svg`
- `public/starter-kit/cover-template-light.svg`
- `public/starter-kit/migration-checklist.md`

Regenerate the files whenever you tweak the examples or checklist steps so the website mirrors the latest guidance.
