import * as React from "react";
import { MediaCarouselRail, type MediaCarouselRailProps } from "./media-carousel-rail";

export type MediaSectionProps = MediaCarouselRailProps;

export function MediaSection(props: MediaSectionProps) {
  return <MediaCarouselRail {...props} />;
}
