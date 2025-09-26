"use client";

import * as Checkbox from "@radix-ui/react-checkbox";
import * as Switch from "@radix-ui/react-switch";
import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { buildDeckFiltersPath } from "./deck-filters-helpers";

interface DeckFiltersProps {
  searchPlaceholder: string;
  labels: {
    language: string;
    difficultyMin: string;
    difficultyMax: string;
    categories: string;
    tags: string;
    nsfw: string;
    apply: string;
    reset: string;
  };
  available: {
    languages: string[];
    categories: string[];
    tags: string[];
    difficultyMin?: number;
    difficultyMax?: number;
  };
  initial: {
    query?: string;
    language?: string;
    categories?: string[];
    tags?: string[];
    difficultyMin?: number;
    difficultyMax?: number;
    includeNSFW: boolean;
  };
}

export function DeckFilters({ searchPlaceholder, labels, available, initial }: DeckFiltersProps) {
  const [query, setQuery] = useState(initial.query ?? "");
  const [language, setLanguage] = useState(initial.language ?? "");
  const [categories, setCategories] = useState<string[]>(initial.categories ?? []);
  const [tags, setTags] = useState<string[]>(initial.tags ?? []);
  const [difficultyMin, setDifficultyMin] = useState<number | undefined>(
    initial.difficultyMin,
  );
  const [difficultyMax, setDifficultyMax] = useState<number | undefined>(
    initial.difficultyMax,
  );
  const [includeNSFW, setIncludeNSFW] = useState(initial.includeNSFW);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    if (language) {
      params.set("language", language);
    } else {
      params.delete("language");
    }

    if (difficultyMin !== undefined && difficultyMin !== null && !Number.isNaN(difficultyMin)) {
      params.set("difficultyMin", String(difficultyMin));
    } else {
      params.delete("difficultyMin");
    }

    if (difficultyMax !== undefined && difficultyMax !== null && !Number.isNaN(difficultyMax)) {
      params.set("difficultyMax", String(difficultyMax));
    } else {
      params.delete("difficultyMax");
    }

    if (categories.length) {
      params.set("categories", categories.join(","));
    } else {
      params.delete("categories");
    }

    if (tags.length) {
      params.set("tags", tags.join(","));
    } else {
      params.delete("tags");
    }

    if (includeNSFW) {
      params.set("nsfw", "true");
    } else {
      params.delete("nsfw");
    }

    params.delete("page");

    const target = buildDeckFiltersPath(pathname, params);

    startTransition(() => {
      router.replace(target);
    });
  };

  const resetFilters = () => {
    setQuery("");
    setLanguage("");
    setCategories([]);
    setTags([]);
    setDifficultyMin(undefined);
    setDifficultyMax(undefined);
    setIncludeNSFW(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("language");
    params.delete("difficultyMin");
    params.delete("difficultyMax");
    params.delete("categories");
    params.delete("tags");
    params.delete("nsfw");
    params.delete("page");
    const target = buildDeckFiltersPath(pathname, params);

    startTransition(() => {
      router.replace(target);
    });
  };

  const toggleCategory = (value: string, checked: boolean) => {
    setCategories((prev) => {
      if (checked) {
        return [...new Set([...prev, value])];
      }
      return prev.filter((item) => item !== value);
    });
  };

  const toggleTag = (value: string, checked: boolean) => {
    setTags((prev) => {
      if (checked) {
        return [...new Set([...prev, value])];
      }
      return prev.filter((item) => item !== value);
    });
  };

  return (
    <form
      className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-foreground/80">
          <span>{searchPlaceholder}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="rounded-full border border-border/60 bg-surface px-4 py-3 text-sm text-foreground shadow-inner"
            type="search"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground/80">
          <span>{labels.language}</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-full border border-border/60 bg-surface px-4 py-3 text-sm text-foreground shadow-inner"
          >
            <option value="">—</option>
            {available.languages.map((value) => (
              <option key={value} value={value}>
                {value.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-foreground/80">
          <span>{labels.difficultyMin}</span>
          <input
            type="number"
            min={available.difficultyMin ?? 0}
            max={available.difficultyMax ?? 10}
            value={difficultyMin ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              setDifficultyMin(value ? Number(value) : undefined);
            }}
            className="rounded-full border border-border/60 bg-surface px-4 py-3 text-sm text-foreground shadow-inner"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground/80">
          <span>{labels.difficultyMax}</span>
          <input
            type="number"
            min={available.difficultyMin ?? 0}
            max={available.difficultyMax ?? 10}
            value={difficultyMax ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              setDifficultyMax(value ? Number(value) : undefined);
            }}
            className="rounded-full border border-border/60 bg-surface px-4 py-3 text-sm text-foreground shadow-inner"
          />
        </label>
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-foreground/80">
          {labels.categories}
        </legend>
        <div className="flex flex-wrap gap-3">
          {available.categories.map((category) => {
            const checked = categories.includes(category);
            return (
              <label
                key={category}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-2 text-xs font-medium text-foreground/80 shadow-sm"
              >
                <Checkbox.Root
                  className="flex h-4 w-4 items-center justify-center rounded border border-border/60 bg-surface"
                  checked={checked}
                  onCheckedChange={(value) => toggleCategory(category, Boolean(value))}
                >
                  <Checkbox.Indicator>
                    <Check className="h-3 w-3" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                {category}
              </label>
            );
          })}
        </div>
      </fieldset>
      {available.tags.length ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-foreground/80">
            {labels.tags}
          </legend>
          <div className="flex flex-wrap gap-3">
            {available.tags.map((tag) => {
              const checked = tags.includes(tag);
              return (
                <label
                  key={tag}
                  className="flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-2 text-xs font-medium text-foreground/80 shadow-sm"
                >
                  <Checkbox.Root
                    className="flex h-4 w-4 items-center justify-center rounded border border-border/60 bg-surface"
                    checked={checked}
                    onCheckedChange={(value) => toggleTag(tag, Boolean(value))}
                  >
                    <Checkbox.Indicator>
                      <Check className="h-3 w-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  {tag}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      <label className="flex items-center justify-between rounded-3xl bg-muted px-4 py-3 text-sm text-foreground/80">
        <span>{labels.nsfw}</span>
        <Switch.Root
          checked={includeNSFW}
          onCheckedChange={(value) => setIncludeNSFW(Boolean(value))}
          className="relative inline-flex h-6 w-12 items-center rounded-full bg-foreground/20 transition data-[state=checked]:bg-primary"
        >
          <Switch.Thumb className="block h-5 w-5 translate-x-1 rounded-full bg-surface transition data-[state=checked]:translate-x-6" />
        </Switch.Root>
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {labels.apply}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={resetFilters}
          disabled={isPending}
        >
          {labels.reset}
        </Button>
      </div>
    </form>
  );
}
