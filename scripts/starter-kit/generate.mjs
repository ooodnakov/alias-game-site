import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputDir = resolve(__dirname, "../../public/starter-kit");

const deckWordSchema = z.object({
  text: z.string().min(1),
  difficulty: z.number().int().min(0).max(10).optional(),
  category: z.string().optional(),
  wordClass: z.string().optional(),
});

const deckSchema = z.object({
  title: z.string().min(1).max(100),
  author: z.string().min(1).max(100),
  language: z.enum(["en", "ru"]),
  allowNSFW: z.boolean().default(false),
  words: z.array(deckWordSchema).min(20),
  metadata: z
    .object({
      categories: z.array(z.string()).default([]),
      wordClasses: z.array(z.string()).default([]),
      coverImage: z.string().url().optional(),
      version: z.string().optional(),
    })
    .default({ categories: [], wordClasses: [] }),
});

const starterDeck = deckSchema.parse({
  title: "Community Kickoff",
  author: "Alioss Starter Kit",
  language: "en",
  allowNSFW: false,
  metadata: {
    categories: ["Party", "Warm-up"],
    wordClasses: ["NOUN", "VERB", "ADJ"],
    version: "2024.11",
    coverImage: "https://alioss.app/starter-kit/cover-template-dark.svg",
  },
  words: [
    { text: "Icebreaker", difficulty: 1, category: "Party", wordClass: "NOUN" },
    { text: "Celebrate", difficulty: 1, category: "Party", wordClass: "VERB" },
    { text: "Host", difficulty: 1, category: "Warm-up", wordClass: "NOUN" },
    { text: "Gesture", difficulty: 2, category: "Warm-up", wordClass: "NOUN" },
    { text: "Sprint", difficulty: 2, category: "Warm-up", wordClass: "VERB" },
    { text: "Guess", difficulty: 1, category: "Warm-up", wordClass: "VERB" },
    { text: "Cheer", difficulty: 1, category: "Party", wordClass: "VERB" },
    { text: "Scoreboard", difficulty: 2, category: "Warm-up", wordClass: "NOUN" },
    { text: "Victory", difficulty: 2, category: "Party", wordClass: "NOUN" },
    { text: "Rematch", difficulty: 2, category: "Party", wordClass: "NOUN" },
    { text: "Challenge", difficulty: 2, category: "Warm-up", wordClass: "NOUN" },
    { text: "Banter", difficulty: 2, category: "Party", wordClass: "NOUN" },
    { text: "Whisper", difficulty: 1, category: "Warm-up", wordClass: "VERB" },
    { text: "Timer", difficulty: 1, category: "Warm-up", wordClass: "NOUN" },
    { text: "Prompt", difficulty: 1, category: "Warm-up", wordClass: "NOUN" },
    { text: "Clue", difficulty: 1, category: "Warm-up", wordClass: "NOUN" },
    { text: "Spotlight", difficulty: 1, category: "Party", wordClass: "NOUN" },
    { text: "Encore", difficulty: 2, category: "Party", wordClass: "NOUN" },
    { text: "Laugh", difficulty: 1, category: "Party", wordClass: "VERB" },
    { text: "Victory dance", difficulty: 2, category: "Party", wordClass: "NOUN" },
  ],
});

const migrationChecklist = [
  {
    title: "Normalise deck structure",
    detail:
      "Export your existing words to JSON and run them through the starter kit schema to make sure fields like `language`, `allowNSFW`, and `metadata` are set.",
  },
  {
    title: "Audit difficulty and categories",
    detail:
      "Use the helper spreadsheet or your own notes to tag each word with a difficulty from 0–10 plus any category or part of speech you want surfaced in search.",
  },
  {
    title: "Generate cover art",
    detail:
      "Drop your deck title into the SVG templates and export a 1080×1080 PNG so the gallery shows a consistent thumbnail.",
  },
  {
    title: "Validate before upload",
    detail:
      "Drag the JSON into `/decks/upload` and confirm the preview renders. Fix any validation errors before submitting to moderation.",
  },
  {
    title: "Test the in-app import",
    detail:
      "Open the Android app, paste the JSON URL, and run a quick round to verify timers, categories, and NSFW toggles behave as expected.",
  },
];

const darkCoverSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1f1b2e" />
      <stop offset="100%" stop-color="#4a3d7a" />
    </linearGradient>
    <linearGradient id="accent" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f4acff" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#6bd6ff" stop-opacity="0.6" />
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" rx="64" fill="url(#bg)" />
  <circle cx="260" cy="240" r="140" fill="url(#accent)" />
  <circle cx="860" cy="320" r="110" fill="url(#accent)" opacity="0.6" />
  <circle cx="820" cy="800" r="220" fill="url(#accent)" opacity="0.35" />
  <text x="120" y="620" fill="#ffffff" font-family="'Inter', 'Segoe UI', sans-serif" font-size="72" font-weight="600">
    Deck Title
  </text>
  <text x="120" y="700" fill="#c5c0e6" font-family="'Inter', 'Segoe UI', sans-serif" font-size="40">
    Subtitle or creator name
  </text>
  <text x="120" y="820" fill="#ffffff" font-family="'Inter', 'Segoe UI', sans-serif" font-size="28" letter-spacing="4">
    ALIOSS STARTER TEMPLATE
  </text>
</svg>
`;

const lightCoverSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f4f6ff" />
      <stop offset="100%" stop-color="#dde7ff" />
    </linearGradient>
    <linearGradient id="accent" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5c4dff" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#ff80b5" stop-opacity="0.6" />
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" rx="64" fill="url(#bg)" />
  <circle cx="260" cy="240" r="140" fill="url(#accent)" />
  <circle cx="860" cy="320" r="110" fill="url(#accent)" opacity="0.45" />
  <circle cx="820" cy="800" r="220" fill="url(#accent)" opacity="0.25" />
  <text x="120" y="620" fill="#1f1b2e" font-family="'Inter', 'Segoe UI', sans-serif" font-size="72" font-weight="600">
    Deck Title
  </text>
  <text x="120" y="700" fill="#433a60" font-family="'Inter', 'Segoe UI', sans-serif" font-size="40">
    Subtitle or creator name
  </text>
  <text x="120" y="820" fill="#1f1b2e" font-family="'Inter', 'Segoe UI', sans-serif" font-size="28" letter-spacing="4">
    ALIOSS STARTER TEMPLATE
  </text>
</svg>
`;

function formatChecklistMarkdown(items) {
  const lines = ["# Deck migration checklist", "", "Generated by scripts/starter-kit/generate.mjs", ""];
  for (const item of items) {
    lines.push(`## ${item.title}`);
    lines.push("");
    lines.push(item.detail);
    lines.push("");
  }
  return `${lines.join("\n")}`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const deckPath = resolve(outputDir, "deck-template.json");
  const checklistPath = resolve(outputDir, "migration-checklist.md");
  const darkCoverPath = resolve(outputDir, "cover-template-dark.svg");
  const lightCoverPath = resolve(outputDir, "cover-template-light.svg");

  await Promise.all([
    writeFile(deckPath, `${JSON.stringify(starterDeck, null, 2)}\n`, "utf8"),
    writeFile(checklistPath, `${formatChecklistMarkdown(migrationChecklist)}\n`, "utf8"),
    writeFile(darkCoverPath, darkCoverSvg, "utf8"),
    writeFile(lightCoverPath, lightCoverSvg, "utf8"),
  ]);
}

main().catch((error) => {
  console.error("Failed to generate starter kit assets:", error);
  process.exitCode = 1;
});
