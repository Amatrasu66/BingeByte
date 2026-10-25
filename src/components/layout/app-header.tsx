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
  onSearchClick?: () => void;
}

export function AppHeader({ className, onSearchClick }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-background)]/90 backdrop-blur-sm",
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
          <PrimaryNavigation />
        </div>

        {/* Right: Actions & Mobile Navigation */}
        <div className="flex items-center gap-2">
          <IconButton
            aria-label="Search entertainment catalog"
            variant="ghost"
            size="md"
            onClick={onSearchClick}
          >
            <Search className="h-4 w-4" />
          </IconButton>

          <MobileNavigation />
        </div>
      </MainContainer>
    </header>
  );
}
