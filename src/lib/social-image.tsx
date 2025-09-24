import type { ReactElement, CSSProperties } from "react";

import type { DeckMetadata } from "@/lib/deck-store";
import { buildDeckJsonUrl } from "@/lib/url";

const palettes: Array<[string, string, string]> = [
  ["#0f172a", "#1e3a8a", "#38bdf8"],
  ["#111827", "#312e81", "#f472b6"],
  ["#082f49", "#0f766e", "#34d399"],
  ["#111827", "#7c2d12", "#fb923c"],
  ["#0b1120", "#1f2937", "#a855f7"],
];

function pickPalette(key: string) {
  const hash = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface DeckSocialImageOptions {
  locale: string;
  width: number;
  height: number;
  detailPath: string;
}

export function renderDeckSocialImage(
  metadata: DeckMetadata | undefined,
  { locale, width, height, detailPath }: DeckSocialImageOptions,
): ReactElement {
  const palette = pickPalette(metadata?.slug ?? "alias");
  const background = `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
  const accent = palette[2];
  const neutralBadge = hexToRgba("#0f172a", 0.45);
  const accentBadge = hexToRgba(accent, 0.35);
  const nf = new Intl.NumberFormat(locale);
  const difficultyRange = metadata &&
    (metadata.difficultyMin !== undefined || metadata.difficultyMax !== undefined)
    ? `${metadata.difficultyMin ?? "–"} – ${metadata.difficultyMax ?? "–"}`
    : null;

  const description = metadata
    ? metadata.description ?? `Community-made Alias deck with ${nf.format(metadata.wordCount)} words.`
    : "Discover community-made decks for Alias with offline-friendly imports.";

  const badges = metadata
    ? [
        `${metadata.language.toUpperCase()} deck`,
        `${nf.format(metadata.wordCount)} words`,
        difficultyRange ? `${difficultyRange} difficulty` : null,
      ].filter(Boolean) as string[]
    : ["Community decks", "Offline ready", "No telemetry"];

  const tagList = metadata?.tags.slice(0, 4) ?? [];
  const importPath = metadata ? buildDeckJsonUrl(metadata.slug) : "https://alias-game.app";

  const containerStyle: CSSProperties = {
    width,
    height,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "64px",
    background,
    color: "#f8fafc",
    fontFamily: "'Inter', 'DM Sans', 'Segoe UI', sans-serif",
  };

  const badgeStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "12px 22px",
    fontSize: 26,
    fontWeight: 600,
    marginRight: 16,
    marginBottom: 16,
    backgroundColor: neutralBadge,
  };

  const tagStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "10px 18px",
    fontSize: 24,
    fontWeight: 600,
    marginRight: 12,
    marginBottom: 12,
    backgroundColor: accentBadge,
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: 28,
            letterSpacing: 10,
            textTransform: "uppercase",
            opacity: 0.75,
          }}
        >
          Alias Decks
        </span>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column" }}>
          <h1
            style={{
              fontSize: metadata ? 72 : 64,
              fontWeight: 700,
              lineHeight: 1.05,
              margin: 0,
              maxWidth: "90%",
            }}
          >
            {metadata?.title ?? "Alias community decks"}
          </h1>
          <p
            style={{
              marginTop: 24,
              fontSize: 30,
              lineHeight: 1.4,
              maxWidth: "90%",
              opacity: 0.85,
            }}
          >
            {description}
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 32 }}>
          {badges.map((badge) => (
            <span key={badge} style={badgeStyle}>
              {badge}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 32,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "70%" }}>
          {metadata ? (
            <span style={{ fontSize: 30, fontWeight: 600, opacity: 0.9 }}>
              by {metadata.author}
            </span>
          ) : (
            <span style={{ fontSize: 30, fontWeight: 600, opacity: 0.9 }}>
              alias-game.app
            </span>
          )}
          {tagList.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", marginTop: 20 }}>
              {tagList.map((tag) => (
                <span key={tag} style={tagStyle}>
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 24, opacity: 0.8, margin: 0 }}>{detailPath}</p>
          <p style={{ fontSize: 22, opacity: 0.6, marginTop: 12 }}>{importPath}</p>
        </div>
      </div>
    </div>
  );
}
