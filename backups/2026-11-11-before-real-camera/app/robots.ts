// app/robots.ts  (makes /robots.txt: tells search engines what they may look at, and where the sitemap is)
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://wingwang.ca/sitemap.xml",
  };
}
