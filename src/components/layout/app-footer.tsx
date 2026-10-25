import * as React from "react";
import { siteConfig } from "@/config/site";
import { MainContainer } from "@/components/layout/main-container";
import { cn } from "@/lib/utils";

export interface AppFooterProps {
  className?: string;
}

export function AppFooter({ className }: AppFooterProps) {
  return (
    <footer
      className={cn(
        "w-full border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] py-12 sm:py-16 text-[var(--color-text-secondary)]",
        className
      )}
    >
      <MainContainer>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-[var(--color-border-subtle)]">
          <div className="max-w-md">
            <span className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {siteConfig.name}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Cinematic entertainment discovery platform for movies, series, and anime.
              Crafted with a dedicated dark charcoal foundation and Geist typography.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--color-text-muted)]">
            <span>Phase 2 · Design System</span>
            <span aria-hidden="true">·</span>
            <span>Geist Typography</span>
            <span aria-hidden="true">·</span>
            <span>Pure Token Architecture</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
          <p>© 2025 {siteConfig.name}. All rights reserved.</p>
          <p>Designed with restrained cinematic principles.</p>
        </div>
      </MainContainer>
    </footer>
  );
}
