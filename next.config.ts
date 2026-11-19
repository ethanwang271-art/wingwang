import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.2.144.208"],
  poweredByHeader: false, // don't advertise "Next.js" in every response
  // when the site was built, for the "updated 2 days ago" in the home page's footer (filled in by itself each time
  // the site is built; on your computer it's when you started `npm run dev`)
  env: { SITE_UPDATED: new Date().toISOString() },
  images: {
    // Next 16 only allows the qualities listed here. The photo viewer asks for 90, everything else uses 75.
    qualities: [75, 90],
    // keep resized photos cached for 7 days instead of 4 hours, so repeat visits don't resize them again.
    // (if you replace a photo but keep the same file name, give it a new name to see the change sooner)
    minimumCacheTTL: 604800,
  },
  async headers() {
    return [
      {
        // your photos and your picture: let browsers keep them for a week
        source: "/:file(.*\\.(?:jpg|jpeg|JPG|JPEG|png|webp))",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
