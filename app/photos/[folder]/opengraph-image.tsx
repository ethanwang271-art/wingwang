// app/photos/[folder]/opengraph-image.tsx
// The picture that shows up when someone shares one of your albums (in a text, a DM, discord, etc.):
// the album's cover photo filling the whole card, with its name and photo count written on top in white.
// Next.js finds this file by its name and makes one picture per album when the site is built.
// (It has to be its own file with exactly this name, next to the album page; it isn't a page itself.)
import { ImageResponse } from "next/og";
import path from "node:path";
import { getFolder, getFolders } from "../data";

// ---- tweak these ----
const CARD_SITE = "wingwang.ca";        // the web address written in the bottom right
const CARD_BY = "photos by ethan wang"; // written under the album's name, after the number of photos
const CARD_SHADE = 0.62;                // how dark the fade behind the writing gets at the bottom (0 = none, 1 = black)

export const alt = "an album of photos by ethan wang";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg"; // (a jpeg is about a tenth the size of a png, so apps don't skip it)

// one picture per album, made when the site is built
export function generateStaticParams() {
  return getFolders().map((f) => ({ folder: f.id }));
}

// the cover photo, turned the right way up and cropped to fill the card (keeping the most interesting part).
// If it can't be read, the card is plain dark grey instead
async function coverPhoto(coverUrl: string) {
  if (!coverUrl) return "";
  try {
    const file = path.join(process.cwd(), "public", decodeURIComponent(coverUrl));
    const sharp = (await import("sharp")).default;
    const buf = await sharp(file)
      .rotate() // phone and camera photos are often stored on their side, with a note saying which way is up
      .resize(size.width, size.height, { fit: "cover", position: sharp.strategy.attention })
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
  const photo = summary ? await coverPhoto(summary.cover) : "";
  const titleSize = name.length > 26 ? 60 : name.length > 16 ? 72 : 88;
  const shade = (a: number) => `rgba(0,0,0,${(a * CARD_SHADE).toFixed(3)})`;

  const card = new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: "#1c1c1e", color: "#ffffff" }}>
        {photo && (
          <img src={photo} width={size.width} height={size.height} style={{ position: "absolute", top: 0, left: 0 }} alt="" />
        )}
        {/* a soft dark fade at the bottom (and a little at the top) so the white writing reads on any photo */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            backgroundImage: `linear-gradient(to bottom, ${shade(0.45)} 0%, ${shade(0)} 26%, ${shade(0)} 42%, ${shade(0.75)} 74%, ${shade(1)} 100%)`,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", width: "100%", height: "100%", padding: "48px 56px 50px" }}>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: -0.5 }}>wingwang</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}>
              <div style={{ display: "flex", fontSize: titleSize, lineHeight: 1.02, letterSpacing: -2.5 }}>{name}</div>
              <div style={{ display: "flex", marginTop: 16, fontSize: 30, color: "rgba(255,255,255,.85)" }}>
                {count > 0 ? `${count} ${CARD_BY}` : CARD_BY}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 28, color: "rgba(255,255,255,.85)", paddingBottom: 4 }}>{CARD_SITE}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
  // the card is drawn as a png; turn it into a much smaller jpeg
  const png = Buffer.from(await card.arrayBuffer());
  try {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(png).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg" } });
  } catch {
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
  }
}
