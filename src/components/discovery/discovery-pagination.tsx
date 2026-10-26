import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type ValidatedDiscoverFilters,
  serializeDiscoverSearchParams,
} from "@/lib/tmdb/discover-types";

export interface DiscoveryPaginationProps {
  basePath: string;
  currentFilters: ValidatedDiscoverFilters;
  currentPage: number;
  totalPages: number;
}

export function DiscoveryPagination({
  basePath,
  currentFilters,
  currentPage,
  totalPages,
}: DiscoveryPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const clampedTotalPages = Math.min(500, totalPages);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < clampedTotalPages;

  const prevUrl = `${basePath}${serializeDiscoverSearchParams(currentFilters, {
    page: currentPage - 1,
  })}`;

  const nextUrl = `${basePath}${serializeDiscoverSearchParams(currentFilters, {
    page: currentPage + 1,
  })}`;

  return (
    <nav
      aria-label="Discovery catalog pagination"
      className="pt-8 flex items-center justify-center gap-3"
    >
      {hasPrevious ? (
        <Link href={prevUrl} aria-label="Go to previous results page">
          <Button variant="secondary" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
        </Link>
      ) : (
        <Button variant="secondary" size="sm" disabled aria-disabled="true">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
      )}

      <span className="text-xs text-[var(--color-text-secondary)] px-2">
        {currentPage} / {clampedTotalPages}
      </span>

      {hasNext ? (
        <Link href={nextUrl} aria-label="Go to next results page">
          <Button variant="secondary" size="sm">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      ) : (
        <Button variant="secondary" size="sm" disabled aria-disabled="true">
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </nav>
  );
}
