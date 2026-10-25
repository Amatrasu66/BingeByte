import * as React from "react";
import { cn } from "@/lib/utils";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      className,
      orientation = "horizontal",
      decorative = true,
      role = decorative ? "none" : "separator",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role={role}
        aria-orientation={orientation === "vertical" ? "vertical" : undefined}
        className={cn(
          "shrink-0 bg-[var(--color-border-subtle)]",
          orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";
