"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Film, Tv, Sparkles, Flame, Star, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const movieCategories = [
  {
    title: "Trending Movies",
    href: "/#trending",
    description: "The most popular cinematic releases captivating audiences today.",
    icon: Flame,
  },
  {
    title: "Popular Releases",
    href: "/movies",
    description: "Explore the worldwide box-office favorites and top-ranking films.",
    icon: Film,
  },
  {
    title: "Top Rated Films",
    href: "/#top-rated",
    description: "Critically acclaimed masterworks and all-time audience favorites.",
    icon: Star,
  },
];

const tvCategories = [
  {
    title: "Trending Series",
    href: "/#trending",
    description: "The most-watched drama, thriller, and serialized television today.",
    icon: Flame,
  },
  {
    title: "Popular TV Shows",
    href: "/tv",
    description: "Browse award-winning drama, comedy, and sci-fi series.",
    icon: Tv,
  },
  {
    title: "Discover Anime",
    href: "/anime",
    description: "Curated Japanese anime series, seasonal hits, and classics.",
    icon: Sparkles,
  },
];

const discoverItems = [
  {
    title: "Catalog Search",
    href: "/search",
    description: "Search across movies, television series, and anime with filters.",
    icon: Compass,
  },
  {
    title: "Anime Hub",
    href: "/anime",
    description: "Explore dedicated animation rankings and seasonal releases.",
    icon: Sparkles,
  },
];

const ListItem = React.forwardRef<
  HTMLAnchorElement,
  {
    title: string;
    href: string;
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
  }
>(({ title, href, children, icon: Icon, className, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href}
          className={cn(
            "group flex items-start gap-3 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-white)] focus:bg-[var(--color-surface)] focus:text-[var(--color-white)]",
            className
          )}
          {...props}
        >
          {Icon && (
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] text-[var(--color-text-secondary)] group-hover:border-[var(--color-border-hover)] group-hover:text-[var(--color-text-primary)] transition-colors">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium leading-none text-[var(--color-text-primary)] group-hover:text-[var(--color-white)]">
              {title}
            </div>
            <p className="line-clamp-2 text-xs leading-normal text-[var(--color-text-secondary)]">
              {children}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export interface PrimaryNavigationProps {
  className?: string;
}

export function PrimaryNavigation({ className }: PrimaryNavigationProps) {
  return (
    <div className={cn("hidden md:flex items-center", className)}>
      <NavigationMenu>
        <NavigationMenuList>
          {/* Home Direct Link */}
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href="/">Home</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          {/* Movies Dropdown */}
          <NavigationMenuItem>
            <NavigationMenuTrigger>Movies</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[380px] gap-1 p-2 md:w-[460px] md:grid-cols-1">
                {movieCategories.map((item) => (
                  <ListItem
                    key={item.title}
                    title={item.title}
                    href={item.href}
                    icon={item.icon}
                  >
                    {item.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* TV Shows Dropdown */}
          <NavigationMenuItem>
            <NavigationMenuTrigger>TV Shows</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[380px] gap-1 p-2 md:w-[460px] md:grid-cols-1">
                {tvCategories.map((item) => (
                  <ListItem
                    key={item.title}
                    title={item.title}
                    href={item.href}
                    icon={item.icon}
                  >
                    {item.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Discover Dropdown */}
          <NavigationMenuItem>
            <NavigationMenuTrigger>Discover</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[360px] gap-1 p-2 md:w-[420px]">
                {discoverItems.map((item) => (
                  <ListItem
                    key={item.title}
                    title={item.title}
                    href={item.href}
                    icon={item.icon}
                  >
                    {item.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Direct Anime Link */}
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href="/anime">Anime</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
