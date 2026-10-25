import * as React from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string; // Enforce accessible name for icon-only buttons
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "md",
      disabled,
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md transition-colors duration-150 select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-ring";

    const variantStyles: Record<NonNullable<IconButtonProps["variant"]>, string> = {
      primary:
        "bg-[var(--color-text-primary)] text-[var(--color-background)] hover:bg-[var(--color-white)]",
      secondary:
        "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-elevated)]",
      ghost:
        "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]",
    };

    const sizeStyles: Record<NonNullable<IconButtonProps["size"]>, string> = {
      sm: "h-8 w-8 p-1.5",
      md: "h-10 w-10 p-2",
      lg: "h-12 w-12 p-2.5",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
