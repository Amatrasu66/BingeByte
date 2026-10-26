"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SearchContentType = "all" | "movie" | "tv";

export interface SearchInputProps {
  initialQuery?: string;
  initialType?: SearchContentType;
  className?: string;
}

const CONTENT_TYPES: { value: SearchContentType; label: string }[] = [
  { value: "all", label: "All Titles" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Series" },
];

export function SearchInput({
  initialQuery = "",
  initialType = "all",
  className,
}: SearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery);
  const [contentType, setContentType] = React.useState<SearchContentType>(initialType);

  // Synchronize state if URL search parameters update externally
  const [prevQuery, setPrevQuery] = React.useState(initialQuery);
  const [prevType, setPrevType] = React.useState(initialType);

  if (prevQuery !== initialQuery || prevType !== initialType) {
    setPrevQuery(initialQuery);
    setPrevType(initialType);
    setQuery(initialQuery);
    setContentType(initialType);
  }

  function buildUrl(q: string, type: SearchContentType): string {
    const trimmed = q.trim();
    if (!trimmed) {
      return type !== "all" ? `/search?type=${type}` : "/search";
    }
    const params = new URLSearchParams();
    params.set("q", trimmed);
    if (type !== "all") {
      params.set("type", type);
    }
    return `/search?${params.toString()}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl(query, contentType));
  }

  function handleTypeChange(newType: SearchContentType) {
    setContentType(newType);
    // If a query is already entered, immediately navigate with the new type
    if (query.trim()) {
      router.push(buildUrl(query, newType));
    }
  }

  function handleClear() {
    setQuery("");
    if (contentType !== "all") {
      router.push(`/search?type=${contentType}`);
    } else {
      router.push("/search");
    }
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-3", className)}>
      {/* Content Type Filter Bar */}
      <div
        role="group"
        aria-label="Filter by content type"
        className="flex items-center justify-center gap-1.5"
      >
        {CONTENT_TYPES.map((type) => {
          const isSelected = contentType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => handleTypeChange(type.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 focus-ring cursor-pointer border",
                isSelected
                  ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border-hover)]"
                  : "bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)]"
              )}
              aria-pressed={isSelected}
            >
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Main Search Input Form */}
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Entertainment search"
        className="relative flex items-center w-full"
      >
        <label htmlFor="search-field" className="sr-only">
          Search movies, television series, and anime
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
          placeholder={`Search ${contentType === "movie" ? "movies" : contentType === "tv" ? "TV series" : "movies, television, and anime"}...`}
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
              className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] focus-ring transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </div>
      </form>
    </div>
  );
}
