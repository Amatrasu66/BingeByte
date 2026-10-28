import * as React from "react";
import { AppHeader } from "./app-header";
import { AppFooter } from "./app-footer";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  isCinematicHeader?: boolean;
}

export function AppShell({ children, className, isCinematicHeader }: AppShellProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-text-primary)]", className)}>
      <AppHeader isCinematic={isCinematicHeader} />
      <div className="flex-1">
        {children}
      </div>
      <AppFooter />
    </div>
  );
}
