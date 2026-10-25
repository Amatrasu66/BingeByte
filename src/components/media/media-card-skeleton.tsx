import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface MediaCardSkeletonProps {
  className?: string;
}

export function MediaCardSkeleton({ className }: MediaCardSkeletonProps) {
  return (
    <div className={cn("flex flex-col", className)} aria-hidden="true">
      {/* 2:3 Poster Frame Skeleton */}
      <Skeleton className="aspect-[2/3] w-full rounded-md border border-[var(--color-border-subtle)]" />

      {/* Title & Metadata Skeleton */}
      <div className="mt-2.5 flex flex-col gap-1.5">
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-2/5 rounded" />
      </div>
    </div>
  );
}
