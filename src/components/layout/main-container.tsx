import * as React from "react";
import { cn } from "@/lib/utils";

export interface MainContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export const MainContainer = React.forwardRef<HTMLDivElement, MainContainerProps>(
  ({ as: Component = "div", className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

MainContainer.displayName = "MainContainer";
