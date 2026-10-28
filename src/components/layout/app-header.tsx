"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { siteConfig } from "@/config/site";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { IconButton } from "@/components/ui/icon-button";
import { MainContainer } from "@/components/layout/main-container";
import { cn } from "@/lib/utils";

export interface AppHeaderProps {
  className?: string;
  isCinematic?: boolean;
  onSearchClick?: () => void;
}

export function AppHeader({ className, isCinematic = false, onSearchClick }: AppHeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    if (!isCinematic) return;

    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 30);
    };

    // Initial check
    handleScroll();

    // Use passive listener per Vercel performance best practices
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isCinematic]);

  return (
    <header
      className={cn(
        isCinematic
          ? cn(
              "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-out",
              isScrolled
                ? "border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/95 backdrop-blur-md shadow-md"
                : "border-b border-transparent bg-gradient-to-b from-[var(--color-surface-deep)]/80 via-[var(--color-surface-deep)]/30 to-transparent"
            )
          : "sticky top-0 z-40 w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-background)]/90 backdrop-blur-sm",
        className
      )}
    >
      <MainContainer className="flex h-16 items-center justify-between">
        {/* Left: Approved Wordmark */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 focus-ring rounded-sm py-1"
            aria-label={`${siteConfig.name} Home`}
          >
            <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-white)]">
              {siteConfig.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <React.Suspense fallback={<nav className="hidden md:flex items-center gap-6 h-5 w-48" />}>
            <PrimaryNavigation />
          </React.Suspense>
        </div>

        {/* Right: Actions & Mobile Navigation */}
        <div className="flex items-center gap-2">
          {onSearchClick ? (
            <IconButton
              aria-label="Search entertainment catalog"
              variant="ghost"
              size="md"
              onClick={onSearchClick}
            >
              <Search className="h-4 w-4" />
            </IconButton>
          ) : (
            <Link
              href="/search"
              aria-label="Search entertainment catalog"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]/80 focus-ring transition-colors duration-150"
            >
              <Search className="h-4 w-4" />
            </Link>
          )}

          <React.Suspense fallback={<div className="h-10 w-10 md:hidden" />}>
            <MobileNavigation />
          </React.Suspense>
        </div>
      </MainContainer>
    </header>
  );
}
