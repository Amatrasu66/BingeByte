export interface MediaFixture {
  id: string;
  title: string;
  year: number;
  mediaType: "movie" | "tv" | "anime";
  rating: string;
  quality: string;
}

export const sampleMediaItems: MediaFixture[] = [
  {
    id: "sample-1",
    title: "Solaris Expedition",
    year: 2024,
    mediaType: "movie",
    rating: "8.6",
    quality: "4K",
  },
  {
    id: "sample-2",
    title: "Chronicles of the Deep",
    year: 2023,
    mediaType: "tv",
    rating: "8.9",
    quality: "HD",
  },
  {
    id: "sample-3",
    title: "Ghost in the Wire",
    year: 2024,
    mediaType: "anime",
    rating: "9.1",
    quality: "4K",
  },
  {
    id: "sample-4",
    title: "Midnight in Kyoto",
    year: 2022,
    mediaType: "movie",
    rating: "8.4",
    quality: "HD",
  },
];
