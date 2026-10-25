export const siteConfig = {
  name: "BingeByte",
  description:
    "A cinematic movie, television, anime, and entertainment discovery platform.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
} as const;

export type SiteConfig = typeof siteConfig;
