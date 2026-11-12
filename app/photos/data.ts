// app/photos/data.ts  (server-side helpers that read public/photos)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public", "photos");
const IMG = /\.(jpe?g|png|webp|avif|gif)$/i;
const byName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });
export const pretty = (s: string) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export type FolderSummary = { id: string; title: string; description: string; cover: string; count: number; taken: string };
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

// Reads the camera's own record inside a JPEG (EXIF) and hands back a way to look up its entries, or null if there isn't one.
function exif(file: string) {
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(1 << 18);
    const len = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
    let i = 2;
    while (i + 10 < len) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m === 0xe1 && buf.toString("latin1", i + 4, i + 8) === "Exif") {
        const t = i + 10;
        const le = buf[t] === 0x49;
        const r16 = (o: number) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
        const r32 = (o: number) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
        // find an entry in a list of entries, returning where it is
        const find = (ifd: number, tag: number) => {
          for (let k = 0, c = r16(ifd); k < c; k++) if (r16(ifd + 2 + k * 12) === tag) return ifd + 2 + k * 12;
          return -1;
        };
        const ifd0 = t + r32(t + 4);
        const subAt = find(ifd0, 0x8769); // the camera's own settings live in a second list
        const sub = subAt >= 0 ? t + r32(subAt + 8) : -1;
        const at = (tag: number) => (sub >= 0 ? find(sub, tag) : -1);
        return {
          text: (tag: number, inFirst = false) => {
            const e = inFirst ? find(ifd0, tag) : at(tag);
            return e >= 0 ? buf.toString("latin1", t + r32(e + 8), t + r32(e + 8) + 19) : "";
          },
          // a fraction, e.g. 1/250 for the shutter or 45/10 for f/4.5
          frac: (tag: number) => {
            const e = at(tag);
            if (e < 0) return null;
            const o = t + r32(e + 8);
            const n = r32(o), d = r32(o + 4);
            return d ? { n, d } : null;
          },
          short: (tag: number) => {
            const e = at(tag);
            return e >= 0 ? r16(e + 8) : null;
          },
        };
      }
      if (m === 0xda) return null; // reached the picture itself: no record
      i += 2 + buf.readUInt16BE(i + 2);
    }
  } catch {}
  return null;
}

// When a photo was taken ("2026:10:29 18:53:35"), or "" if it doesn't say.
function takenAt(file: string): string {
  const x = exif(file);
  if (!x) return "";
  return x.text(0x9003) || x.text(0x0132, true); // when the shutter was pressed, or else when the file was last saved
}

export type PhotoSettings = { fstop: string; shutter: string; iso: string; focal: string };

// The settings a photo was shot with, written like on a camera's screen: f/4.5, 1/250, ISO 100, 35mm.
// Only for real photos inside public/photos (no path tricks); null if not found.
export function getPhotoSettings(album: string, photo: string): PhotoSettings | null {
  const match = dirs().find((d) => d === album);
  if (!match || !images(match).includes(photo)) return null;
  const x = exif(path.join(ROOT, match, photo));
  if (!x) return null;
  const f = x.frac(0x829d), sh = x.frac(0x829a), iso = x.short(0x8827), fl = x.frac(0x920a);
  const round1 = (v: number) => String(Math.round(v * 10) / 10);
  return {
    fstop: f ? `f/${round1(f.n / f.d)}` : "",
    shutter: sh ? (sh.n / sh.d >= 1 ? `${round1(sh.n / sh.d)}s` : `1/${Math.round(sh.d / sh.n)}`) : "",
    iso: iso ? `ISO ${iso}` : "",
    focal: fl ? `${Math.round(fl.n / fl.d)}mm` : "",
  };
}

// when an album was shot: the middle date of its photos (so one late edit doesn't move the whole album)
function albumDate(name: string, files: string[]) {
  const dates = files.map((f) => takenAt(path.join(ROOT, name, f))).filter((d) => /^\d{4}:\d\d:\d\d/.test(d)).sort();
  return dates.length ? dates[Math.floor(dates.length / 2)] : "";
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
        taken: albumDate(name, files),
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
    photos: files.map<Photo>((f, i) => ({
      src: url(match, f),
      alt: `${match} photo ${i + 1} of ${files.length}, by Ethan Wang`,
      ...dims(path.join(ROOT, match, f)),
    })),
  };
}