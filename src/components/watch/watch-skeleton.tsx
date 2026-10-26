import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";

export function WatchSkeleton() {
  return (
    <AppShell>
      <div className="w-full animate-pulse-subtle">
        {/* Hero banner skeleton */}
        <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] py-8 px-4 sm:px-8">
          <div className="mx-auto max-w-7xl space-y-3">
            <div className="h-4 w-28 rounded bg-[var(--color-surface)]" />
            <div className="h-8 w-1/2 rounded bg-[var(--color-surface)] sm:h-10" />
            <div className="h-4 w-1/3 rounded bg-[var(--color-surface)]" />
          </div>
        </div>

        {/* Player and content skeletons */}
        <MainContainer className="py-8 space-y-10">
          {/* 16:9 Video Player skeleton */}
          <div className="aspect-video w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]" />

          {/* Providers skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-44 rounded bg-[var(--color-surface)]" />
            <div className="h-32 w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]" />
          </div>
        </MainContainer>
      </div>
    </AppShell>
  );
}
