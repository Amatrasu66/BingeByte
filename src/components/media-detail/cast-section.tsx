import * as React from "react";
import Image from "next/image";
import { getProfileUrl } from "@/lib/tmdb/images";
import type { NormalizedCredit } from "@/lib/tmdb/types";
import { SectionHeading } from "@/components/section-heading";

export interface CastSectionProps {
  cast: NormalizedCredit[];
  limit?: number;
}

export function CastSection({ cast, limit = 12 }: CastSectionProps) {
  if (!cast || cast.length === 0) {
    return null;
  }

  const principalCast = cast.slice(0, limit);

  return (
    <section aria-labelledby="cast-heading" className="w-full">
      <SectionHeading
        title="Top Billed Cast"
        description="Key cast and performers"
        className="mb-6"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {principalCast.map((member) => {
          const profileUrl = getProfileUrl(member.profilePath, "w185");

          return (
            <div
              key={`${member.id}-${member.role}`}
              className="group flex flex-col rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2.5 transition-colors duration-200 hover:border-[var(--color-border-hover)]"
            >
              {/* Profile Image Frame */}
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded bg-[var(--color-surface-deep)]">
                {profileUrl ? (
                  <Image
                    src={profileUrl}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                    <svg
                      className="h-8 w-8 text-[var(--color-border-subtle)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Actor Name & Character */}
              <div className="mt-2.5 flex flex-col">
                <span
                  title={member.name}
                  className="truncate text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]"
                >
                  {member.name}
                </span>
                <span
                  title={member.role}
                  className="mt-0.5 truncate text-[11px] sm:text-xs text-[var(--color-text-secondary)]"
                >
                  {member.role || "Cast"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
