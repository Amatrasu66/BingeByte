"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SearchInputProps {
  initialQuery?: string;
  className?: string;
}

export function SearchInput({ initialQuery = "", className }: SearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = React.useState(initialQuery);

  // Sync state if initialQuery changes across navigations
  if (prevInitialQuery !== initialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  }

  function handleClear() {
    setQuery("");
    router.push("/search");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Entertainment search"
      className={className}
    >
      <div className="relative flex items-center w-full max-w-2xl mx-auto">
        <label htmlFor="search-field" className="sr-only">
          Search movies, television, and anime
        </label>
        <div className="absolute left-4 pointer-events-none text-[var(--color-text-secondary)]">
          <Search className="h-4 w-4" aria-hidden="true" />
        </div>
        <input
          id="search-field"
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, television series, and anime..."
          autoComplete="off"
          spellCheck="false"
          className="w-full h-12 pl-11 pr-24 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus-ring transition-colors hover:border-[var(--color-border-hover)]"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] focus-ring transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
