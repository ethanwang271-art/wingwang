// app/sitemap.ts  (makes /sitemap.xml: the list of pages Google should find. Photo albums are added automatically)
import type { MetadataRoute } from "next";
import { getFolders } from "./photos/data";

const SITE_URL = "https://wingwang.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const albums = getFolders().map((f) => ({
    url: `${SITE_URL}/photos/${encodeURIComponent(f.id)}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/photos`, changeFrequency: "monthly", priority: 0.9 },
    ...albums,
    { url: `${SITE_URL}/projects`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
