// app/photos/data.ts  (server-side helpers that read public/photos)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public", "photos");
const IMG = /\.(jpe?g|png|webp|avif|gif)$/i;
const byName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });
export const pretty = (s: string) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export type FolderSummary = { id: string; title: string; description: string; cover: string; count: number };
export type Photo = { src: string; alt: string; w: number; h: number };

const dirs = () =>
  fs.existsSync(ROOT)
    ? fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort(byName)
    : [];
const images = (name: string) => fs.readdirSync(path.join(ROOT, name)).filter((f) => IMG.test(f)).sort(byName);
const url = (name: string, f: string) => `/photos/${encodeURIComponent(name)}/${encodeURIComponent(f)}`;

function describe(name: string, count: number) {
  const p = path.join(ROOT, name, "description.txt");
  const text = fs.existsSync(p) ? fs.readFileSync(p, "utf8").trim() : "";
  return text || `A collection of ${count} ${count === 1 ? "photo" : "photos"}.`;
}

// Reads a photo's real width/height (JPEG + PNG) so the page can reserve the right
// space before it loads. Falls back to 4:5 for anything else.
function dims(file: string): { w: number; h: number } {
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(1 << 20);
    const len = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);

    if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };

    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let orient = 1;
      let i = 2;
      while (i + 9 < len) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m === 0xe1 && buf.toString("latin1", i + 4, i + 8) === "Exif") {
          const t = i + 10;
          const le = buf[t] === 0x49;
          const r16 = (o: number) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
          const r32 = (o: number) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
          const ifd = t + r32(t + 4);
          for (let k = 0, c = r16(ifd); k < c; k++) {
            if (r16(ifd + 2 + k * 12) === 0x0112) orient = r16(ifd + 10 + k * 12);
          }
        }
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          const h = buf.readUInt16BE(i + 5);
          const w = buf.readUInt16BE(i + 7);
          return orient >= 5 ? { w: h, h: w } : { w, h }; // phone photos are often stored rotated
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch {}
  return { w: 800, h: 1000 };
}

// All folders, for the carousel.
// Optional inside a folder: description.txt (subtitle) and an image named cover.* (cover photo)
export function getFolders(): FolderSummary[] {
  return dirs()
    .map((name) => {
      const files = images(name);
      const cover = files.find((f) => /^cover\./i.test(f)) ?? files[0];
      return {
        id: name,
        title: pretty(name),
        description: describe(name, files.length),
        cover: cover ? url(name, cover) : "",
        count: files.length,
      };
    })
    .filter((f) => f.count > 0);
}

// One folder with every photo, for its own page. Only matches real folders (no path tricks).
export function getFolder(name: string) {
  const match = dirs().find((d) => d === name);
  if (!match) return null;
  const files = images(match);
  return {
    title: pretty(match),
    description: describe(match, files.length),
    photos: files.map<Photo>((f) => ({
      src: url(match, f),
      alt: `${pretty(match)} photo`,
      ...dims(path.join(ROOT, match, f)),
    })),
  };
}