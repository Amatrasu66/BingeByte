"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GooeyInput } from "@/components/ui/gooey-input";
import { cn } from "@/lib/utils";

export type SearchContentType = "all" | "movie" | "tv";

export interface GooeySearchBarProps {
  initialQuery?: string;
  initialType?: SearchContentType;
  className?: string;
}

const CONTENT_TYPES: { value: SearchContentType; label: string }[] = [
  { value: "all", label: "All Titles" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
];

export function GooeySearchBar({
  initialQuery = "",
  initialType = "all",
  className,
}: GooeySearchBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [contentType, setContentType] = useState<SearchContentType>(initialType);

  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [prevInitialType, setPrevInitialType] = useState(initialType);

  // Sync state during render if props changed from external navigation
  if (initialQuery !== prevInitialQuery || initialType !== prevInitialType) {
    setPrevInitialQuery(initialQuery);
    setPrevInitialType(initialType);
    setQuery(initialQuery);
    setContentType(initialType);
  }

  const executeNavigation = (newQuery: string, newType: SearchContentType) => {
    const trimmed = newQuery.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("q", trimmed);
    }
    if (newType !== "all") {
      params.set("type", newType);
    }
    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `/search?${queryString}` : "/search");
    });
  };

  const handleSubmit = (submittedQuery: string) => {
    executeNavigation(submittedQuery, contentType);
  };

  const handleTypeChange = (newType: SearchContentType) => {
    setContentType(newType);
    executeNavigation(query, newType);
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-4", className)}>
      <GooeyInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSubmit}
        placeholder="Search..."
        autoFocus={!initialQuery}
        isLoading={isPending}
      />

      {/* Subtle Content Type Filters */}
      <div
        role="group"
        aria-label="Filter search content type"
        className="flex items-center justify-center gap-2 pt-1"
      >
        {CONTENT_TYPES.map((type) => {
          const isSelected = contentType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => handleTypeChange(type.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-all focus-ring cursor-pointer",
                isSelected
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-white border border-[var(--color-border-subtle)] hover:border-neutral-500"
              )}
              aria-pressed={isSelected}
            >
              {type.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
