import * as React from "react";
import { Info } from "lucide-react";

export interface DiscoveryHeaderProps {
  title: string;
  description: string;
  totalResults?: number;
  currentPage?: number;
  totalPages?: number;
  curatedNote?: string;
}

export function DiscoveryHeader({
  title,
  description,
  totalResults,
  currentPage = 1,
  totalPages = 1,
  curatedNote,
}: DiscoveryHeaderProps) {
  const clampedTotalPages = Math.min(500, totalPages);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl">
            {description}
          </p>
        </div>

        {totalResults !== undefined && totalResults > 0 && (
          <div className="text-xs text-[var(--color-text-secondary)] sm:text-right shrink-0">
            <span className="font-medium text-[var(--color-text-primary)]">
              {totalResults.toLocaleString()}
            </span>{" "}
            titles found
            {clampedTotalPages > 1 && ` · Page ${currentPage} of ${clampedTotalPages}`}
          </div>
        )}
      </div>

      {curatedNote && (
        <div
          role="note"
          aria-label="Curated discovery note"
          className="flex items-start gap-2.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/70 px-4 py-3 text-xs text-[var(--color-text-secondary)]"
        >
          <Info className="h-4 w-4 shrink-0 text-[var(--color-text-primary)] mt-0.5" />
          <p className="leading-relaxed">{curatedNote}</p>
        </div>
      )}
    </div>
  );
}
