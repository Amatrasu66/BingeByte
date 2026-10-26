import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { MediaCardSkeleton } from "@/components/media/media-card-skeleton";

export function DetailSkeleton() {
  return (
    <AppShell>
      <div className="w-full animate-pulse-subtle">
        {/* Hero Banner Skeleton */}
        <div className="relative w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)]">
          <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 sm:pb-16 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
              {/* Poster Skeleton */}
              <div className="relative aspect-[2/3] w-36 sm:w-48 md:w-60 shrink-0 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]" />

              {/* Title & Metadata Skeletons */}
              <div className="flex-1 space-y-4">
                <div className="h-4 w-28 rounded bg-[var(--color-surface)]" />
                <div className="h-8 w-3/4 rounded bg-[var(--color-surface)] sm:h-12" />
                <div className="h-4 w-1/2 rounded bg-[var(--color-surface)]" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded bg-[var(--color-surface)]" />
                  <div className="h-6 w-20 rounded bg-[var(--color-surface)]" />
                  <div className="h-6 w-16 rounded bg-[var(--color-surface)]" />
                </div>
                <div className="space-y-2 pt-4">
                  <div className="h-3 w-full rounded bg-[var(--color-surface)]" />
                  <div className="h-3 w-5/6 rounded bg-[var(--color-surface)]" />
                  <div className="h-3 w-4/6 rounded bg-[var(--color-surface)]" />
                </div>
                <div className="flex gap-3 pt-4">
                  <div className="h-10 w-32 rounded bg-[var(--color-surface)]" />
                  <div className="h-10 w-32 rounded bg-[var(--color-surface)]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body Skeletons */}
        <MainContainer className="py-12 space-y-12">
          {/* Cast Skeleton Row */}
          <div>
            <div className="h-6 w-40 rounded bg-[var(--color-surface)] mb-4" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2.5"
                >
                  <div className="aspect-[2/3] w-full rounded bg-[var(--color-surface-deep)]" />
                  <div className="mt-2 h-3.5 w-3/4 rounded bg-[var(--color-surface-deep)]" />
                  <div className="mt-1 h-3 w-1/2 rounded bg-[var(--color-surface-deep)]" />
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations Skeleton Grid */}
          <div>
            <div className="h-6 w-40 rounded bg-[var(--color-surface)] mb-4" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <MediaCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </MainContainer>
      </div>
    </AppShell>
  );
}
