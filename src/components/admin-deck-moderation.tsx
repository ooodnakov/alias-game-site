"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DeckMetadata, DeckStatus } from "@/lib/deck-store";

const STORAGE_KEY = "alias-admin-token";

type ModerationDeck = DeckMetadata & {
  deckUrl: string;
  jsonUrl: string;
  importUrl: string;
};

interface AdminDeckModerationLabels {
  tokenLabel: string;
  tokenPlaceholder: string;
  saveToken: string;
  clearToken: string;
  refresh: string;
  loading: string;
  loadError: string;
  actionError: string;
  rejectionPrompt: string;
  rejectionRequired: string;
  approve: string;
  reject: string;
  empty: string;
  status: Record<DeckStatus, string>;
  deck: {
    language: string;
    wordCount: string;
    categories: string;
    tags: string;
    nsfw: string;
  };
}

interface AdminDeckModerationProps {
  labels: AdminDeckModerationLabels;
}

interface DeckResponse {
  items?: ModerationDeck[];
}

export function AdminDeckModeration({ labels }: AdminDeckModerationProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [decks, setDecks] = useState<ModerationDeck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingSlug, setProcessingSlug] = useState<string | null>(null);

  const statusBadgeClass = useMemo(() => {
    return {
      published: "bg-emerald-100 text-emerald-700",
      pending: "bg-amber-100 text-amber-800",
      rejected: "bg-rose-100 text-rose-700",
    } as const;
  }, []);

  const fetchDecks = useCallback(
    async (activeToken: string) => {
      setLoading(true);
      setError(null);
      setActionError(null);
      try {
        const response = await fetch(
          "/api/decks?status=pending&nsfw=true&pageSize=50",
          {
            headers: {
              "X-Admin-Token": activeToken,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load decks");
        }

        const payload = (await response.json()) as DeckResponse;
        setDecks(Array.isArray(payload.items) ? payload.items : []);
      } catch {
        setDecks([]);
        setError(labels.loadError);
      } finally {
        setLoading(false);
      }
    },
    [labels.loadError],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setToken(stored);
      setTokenInput(stored);
      void fetchDecks(stored);
    }
  }, [fetchDecks]);

  const handleSaveToken = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = tokenInput.trim();
      if (!trimmed) {
        window.localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setDecks([]);
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, trimmed);
      setToken(trimmed);
      await fetchDecks(trimmed);
    },
    [fetchDecks, tokenInput],
  );

  const handleClearToken = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setTokenInput("");
    setDecks([]);
  }, []);

  const moderateDeck = useCallback(
    async (slug: string, status: DeckStatus, rejectionReason?: string) => {
      if (!token) {
        return;
      }

      setProcessingSlug(slug);
      setActionError(null);
      try {
        const response = await fetch("/api/decks/moderate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Token": token,
          },
          body: JSON.stringify({ slug, status, rejectionReason }),
        });

        if (!response.ok) {
          throw new Error("Moderation failed");
        }

        await fetchDecks(token);
      } catch {
        setActionError(labels.actionError);
      } finally {
        setProcessingSlug(null);
      }
    },
    [fetchDecks, labels.actionError, token],
  );

  const handleApprove = useCallback(
    async (slug: string) => {
      await moderateDeck(slug, "published");
    },
    [moderateDeck],
  );

  const handleReject = useCallback(
    async (slug: string) => {
      const reason = window.prompt(labels.rejectionPrompt, "");
      if (reason === null) {
        return;
      }
      const trimmed = reason.trim();
      if (!trimmed) {
        setActionError(labels.rejectionRequired);
        return;
      }
      await moderateDeck(slug, "rejected", trimmed);
    },
    [labels.rejectionPrompt, labels.rejectionRequired, moderateDeck],
  );

  return (
    <div className="space-y-8">
      <form className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm" onSubmit={handleSaveToken}>
        <label className="flex flex-col gap-2 text-sm text-foreground/80">
          <span className="font-medium">{labels.tokenLabel}</span>
          <input
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder={labels.tokenPlaceholder}
            className="rounded-3xl border border-border/60 bg-surface px-4 py-3 text-sm text-foreground shadow-inner"
            type="password"
            autoComplete="off"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">{labels.saveToken}</Button>
          <Button type="button" variant="ghost" onClick={handleClearToken}>
            {labels.clearToken}
          </Button>
          {token ? (
            <Button type="button" variant="secondary" onClick={() => fetchDecks(token)} disabled={loading}>
              {labels.refresh}
            </Button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <p className="rounded-3xl border border-dashed border-border/60 bg-surface p-10 text-center text-sm text-foreground/60">
          {labels.loading}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-3xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {actionError ? (
        <p className="rounded-3xl bg-amber-100 px-4 py-3 text-sm text-amber-800">{actionError}</p>
      ) : null}

      {token && !loading && !error ? (
        decks.length ? (
          <div className="space-y-6">
            {decks.map((deck) => (
              <article
                key={deck.id}
                className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm"
              >
                <header className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{deck.title}</h3>
                    <p className="text-sm text-foreground/70">{deck.author}</p>
                  </div>
                  <Badge
                    className={`uppercase ${statusBadgeClass[deck.status] ?? "bg-muted text-foreground"}`}
                  >
                    {labels.status[deck.status] ?? deck.status}
                  </Badge>
                </header>
                <div className="flex flex-wrap gap-2 text-xs text-foreground/70">
                  <Badge className="bg-muted text-foreground/80">
                    {labels.deck.language}: {deck.language.toUpperCase()}
                  </Badge>
                  <Badge className="bg-muted text-foreground/80">
                    {labels.deck.wordCount}: {deck.wordCount.toLocaleString()}
                  </Badge>
                  {deck.nsfw ? (
                    <Badge className="bg-primary/10 text-primary">{labels.deck.nsfw}</Badge>
                  ) : null}
                </div>
                {deck.categories.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                      {labels.deck.categories}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2 text-xs text-foreground/70">
                      {deck.categories.map((category) => (
                        <li key={category} className="rounded-full bg-muted px-3 py-1">
                          {category}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {deck.tags.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                      {labels.deck.tags}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2 text-xs text-foreground/70">
                      {deck.tags.map((tag) => (
                        <li key={tag} className="rounded-full bg-muted/60 px-3 py-1">
                          #{tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => handleApprove(deck.slug)}
                    disabled={processingSlug === deck.slug}
                  >
                    {labels.approve}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleReject(deck.slug)}
                    disabled={processingSlug === deck.slug}
                  >
                    {labels.reject}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-border/60 bg-surface p-10 text-center text-sm text-foreground/60">
            {labels.empty}
          </p>
        )
      ) : null}
    </div>
  );
}
