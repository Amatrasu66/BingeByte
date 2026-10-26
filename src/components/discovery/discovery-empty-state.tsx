import * as React from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DiscoveryEmptyStateProps {
  basePath: string;
  hasFilters: boolean;
  mediaTypeLabel?: string;
}

export function DiscoveryEmptyState({
  basePath,
  hasFilters,
  mediaTypeLabel = "titles",
}: DiscoveryEmptyStateProps) {
  return (
    <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-12 text-center text-sm text-[var(--color-text-secondary)]">
      <p className="text-base font-medium text-[var(--color-text-primary)]">
        No {mediaTypeLabel} match the selected criteria
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
        {hasFilters
          ? "Try broadening your filter criteria, widening the year range, or lowering the rating threshold."
          : `No ${mediaTypeLabel} are currently available in this catalog view.`}
      </p>
      {hasFilters && (
        <div className="mt-6">
          <Link href={basePath}>
            <Button variant="secondary" size="sm">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset All Filters
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
