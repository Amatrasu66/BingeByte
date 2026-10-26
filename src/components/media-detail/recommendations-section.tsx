import * as React from "react";
import { MediaCard, mediaItemToCardProps } from "@/components/media/media-card";
import type { NormalizedMedia } from "@/lib/tmdb/types";
import { SectionHeading } from "@/components/section-heading";

export interface RecommendationsSectionProps {
  recommendations: NormalizedMedia[];
  similar?: NormalizedMedia[];
  limit?: number;
}

export function RecommendationsSection({
  recommendations,
  similar = [],
  limit = 10,
}: RecommendationsSectionProps) {
  // Use recommendations, or fallback to similar if recommendations are empty
  const items =
    recommendations && recommendations.length > 0
      ? recommendations.slice(0, limit)
      : similar && similar.length > 0
      ? similar.slice(0, limit)
      : [];

  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recommendations-heading" className="w-full">
      <SectionHeading
        title="More Like This"
        description="Recommended entertainment titles based on this content"
        className="mb-6"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5">
        {items.map((item) => {
          const cardProps = mediaItemToCardProps(item);
          return <MediaCard key={`${item.mediaType}-${item.id}`} {...cardProps} />;
        })}
      </div>
    </section>
  );
}
