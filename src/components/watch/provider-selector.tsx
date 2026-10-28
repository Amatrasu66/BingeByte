"use client";

import * as React from "react";
import type { PlaybackProviderDescriptor } from "@/lib/playback/types";

export interface ProviderSelectorProps {
  availableProviders: PlaybackProviderDescriptor[];
  activeProviderId: string;
  onSelectProvider: (providerId: string) => void;
  isResolving?: boolean;
}

export function ProviderSelector({
  availableProviders,
  activeProviderId,
  onSelectProvider,
  isResolving = false,
}: ProviderSelectorProps) {
  if (!availableProviders || availableProviders.length === 0) {
    return null;
  }

  // If only one provider is available, render informative badge without extraneous switching controls
  if (availableProviders.length === 1) {
    const single = availableProviders[0];
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
        aria-label={`Active playback provider: ${single.name}`}
      >
        <span className="text-[10px] uppercase tracking-wider font-medium text-[var(--color-text-secondary)]">
          Provider:
        </span>
        <span className="font-semibold text-[var(--color-text-primary)]">
          {single.name}
        </span>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Select playback provider"
      className="flex items-center gap-1 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-0.5"
    >
      <span className="px-1.5 text-[10px] uppercase tracking-wider font-medium text-[var(--color-text-secondary)]">
        Provider:
      </span>
      {availableProviders.map((provider) => {
        const isSelected = provider.id === activeProviderId;
        return (
          <button
            key={provider.id}
            type="button"
            disabled={isResolving}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isSelected && !isResolving) {
                onSelectProvider(provider.id);
              }
            }}
            aria-pressed={isSelected}
            className={`cursor-pointer rounded px-2 py-0.5 text-xs font-medium transition-colors focus-ring disabled:opacity-50 ${
              isSelected
                ? "bg-[var(--color-text-primary)] text-[var(--color-background)] font-semibold shadow-xs"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              {provider.name}
              {isSelected && isResolving && (
                <span
                  className="inline-block h-2 w-2 animate-spin rounded-full border border-[var(--color-background)] border-t-transparent"
                  aria-hidden="true"
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
