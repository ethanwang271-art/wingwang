// app/photos/[folder]/opengraph-image.tsx
// The picture that shows up when someone shares one of your albums (in a text, a DM, discord, etc.):
// the album's cover photo on the right, and its name and photo count on the left.
// Next.js finds this file by its name and makes one picture per album when the site is built.
// (It has to be its own file with exactly this name, next to the album page; it isn't a page itself.)
import { ImageResponse } from "next/og";
import path from "node:path";
import { getFolder, getFolders } from "../data";

// ---- tweak these ----
const CARD_SITE = "wingwang.ca";      // the web address written at the bottom
const CARD_BY = "photos by ethan wang"; // written under the album's name, after the number of photos
const CARD_BLUE = "#2f6fde";          // the colour of the web address (same blue as the site's links)
const CARD_PHOTO_WIDTH = 690;         // how wide the photo is (the whole card is 1200 wide)

export const alt = "an album of photos by ethan wang";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// one picture per album, made when the site is built
export function generateStaticParams() {
  return getFolders().map((f) => ({ folder: f.id }));
}

// the cover photo, turned the right way up and shrunk to fit the card (so the card stays small and quick to make).
// If it can't be read, the card just has no photo
async function coverPhoto(coverUrl: string, h: number) {
  if (!coverUrl) return "";
  try {
    const file = path.join(process.cwd(), "public", decodeURIComponent(coverUrl));
    const sharp = (await import("sharp")).default;
    const buf = await sharp(file)
      .rotate() // phone and camera photos are often stored on their side, with a note saying which way is up
      .resize(CARD_PHOTO_WIDTH, h, { fit: "cover", position: sharp.strategy.attention }) // keeps the most interesting part
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export default async function Image({ params }: { params: Promise<{ folder: string }> }) {
  const { folder } = await params;
  let name = folder;
  try { name = decodeURIComponent(folder); } catch {}
  const summary = getFolders().find((f) => f.id === name);
  const count = summary?.count ?? getFolder(name)?.photos.length ?? 0;
  const photo = summary ? await coverPhoto(summary.cover, size.height) : "";
  const titleSize = name.length > 22 ? 54 : name.length > 14 ? 64 : 76;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#ffffff", color: "#111111" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "58px 54px" }}>
          <div style={{ display: "flex", fontSize: 28, letterSpacing: -0.5 }}>wingwang</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: titleSize, lineHeight: 1.04, letterSpacing: -2 }}>{name}</div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 28, color: "#5b5b5b" }}>
              {count > 0 ? `${count} ${CARD_BY}` : CARD_BY}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: CARD_BLUE }}>{CARD_SITE}</div>
        </div>
        {photo && (
          <img src={photo} width={CARD_PHOTO_WIDTH} height={size.height} style={{ objectFit: "cover" }} alt="" />
        )}
      </div>
    ),
    size,
  );
}
