"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
}

export const navigationItems: NavItem[] = [
  { label: "Movies", href: "/movies" },
  { label: "TV Series", href: "/tv" },
  { label: "Anime", href: "/anime" },
  { label: "Categories", href: "/categories" },
];

export interface PrimaryNavigationProps {
  className?: string;
}

export function PrimaryNavigation({ className }: PrimaryNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn("hidden md:flex items-center gap-1", className)}
    >
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 focus-ring",
              isActive
                ? "text-[var(--color-text-primary)] bg-[var(--color-surface)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]/60"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
