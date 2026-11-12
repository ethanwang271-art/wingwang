"use client";
// app/page.tsx  (everything for the home page lives in this one file)

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Lenis from "lenis";

// ---- About me section: edit these ----
const ABOUT_TITLE = "who am i?";
// Each line in quotes is one paragraph. Change them, add more, or delete some.
const ABOUT_TEXT = [
  "hi my names ethan",
  "site is still a work in progress!",
];

// a word in ABOUT_TEXT that gets circled in blue, like with a marker, when the "who am i" page shows ("" = none)
const ABOUT_CIRCLE = "ethan";

// ---- The rest of your about me: edit these ----
// These show under "who am i?" on the first page of the camera's screen, in two columns: the professional side
// on the left and the personal side on the right. Anything in [square brackets] is a placeholder: swap it for your own words (and drop the brackets).
// Keep each one to a line or two so it all fits on a phone. You can delete a row or add one (5 or so per side fits best).
const ABOUT_PRO: { title: string; text: string }[] = [
  { title: "what i do", text: "currently a student at [school], [program / grade, grad year]" },
  { title: "what i shoot", text: "events, street and sports," },
  { title: "experience", text: "[clubs, teams, clients or events you've shot for]" },
  { title: "tools", text: "canon r8, photos editied on lightroom classic" },
  { title: "open to", text: "freelance shoots, collaborations, and job opportunities" },
];
const ABOUT_PERSONAL: { title: string; text: string }[] = [
  { title: "where i'm from", text: "based in Toronto" },
  { title: "why photos", text: "photography has always been cool to me" },
  { title: "outside of photos", text: "[sports, music, games, other hobbies]" },
  { title: "currently into", text: "[what you're listening to, watching or learning]" },
  { title: "what's next", text: "trying to develop new projects" },
];

// ---- The other pages on the camera's screen (photos, videos, projects): edit these ----
// photos: which albums to show (the folder names inside public/photos). If one isn't found, another album fills its spot.
const HOME_ALBUMS = ["summer '26", "OASIS", "senior sunrise"];
// videos: the one video to feature. Put the file in public/videos/ and write its path, for example "/videos/reel.mp4".
// Leave src "" to show a "coming soon" box. poster = an optional picture shown before it plays.
const HOME_VIDEO = { title: "coming soon", caption: "the first videos are on the way.", src: "", poster: "" };
// projects: a short list. Copy the example block (without the //) to add one, newest first.
const HOME_PROJECTS: { date: string; title: string; text: string; href: string }[] = [
  // { date: "mar '26", title: "my project", text: "one line about it", href: "/projects" },
];

// the last page on the camera's screen
const CONTACT_TITLE = "contact me";
const CONTACT_TEXT = "want to shoot something together, or just say hi?";
// the details next to it (underneath on phones), one per row. Anything in [square brackets] is a placeholder:
// swap it for your own words (and drop the brackets). Delete a row or add one (6 fits best).
const CONTACT_MORE: { title: string; text: string }[] = [
  { title: "best for", text: "[event coverage, portraits, sports, collabs]" },
  { title: "availability", text: "[weekends, after school, summer]" },
  { title: "reply time", text: "[usually within a day or two]" },
  { title: "based in", text: "Toronto, [happy to travel around the GTA]" },
  { title: "rates", text: "[message me for a quote]" },
  { title: "find me on", text: "[instagram @yourhandle], linkedin" },
];

// ---- tweak these (smooth scrolling) ----
const LENIS_LERP = 0.12;  // higher = snappier, the page catches up to your scrolling faster; lower = floatier glide (try 0.06 to 0.2)
const LENIS_WHEEL = 3;    // higher = each flick of the wheel or trackpad travels further (1 = normal)

// what Lenis needs so the browser doesn't fight its smooth scrolling
const LENIS_CSS = `
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-smooth iframe { pointer-events: none; }
`;

// the little line under "scroll" that draws itself over and over
const INTRO_CSS = `
@keyframes sc-hint { 0% { transform: scaleY(0); transform-origin: top; } 50% { transform: scaleY(1); transform-origin: top; } 51% { transform-origin: bottom; } 100% { transform: scaleY(0); transform-origin: bottom; } }
.sc-hint { animation: sc-hint 2.2s cubic-bezier(.65,0,.35,1) infinite; }
@media (prefers-reduced-motion: reduce) { .sc-hint { animation: none; } }
`;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// ---- tweak these ----

// ---- colours ----
const PAGE_BLACK = "11,13,15";    // r,g,b of the page's black (taken from your swatch)
const BLUE = "100,159,255";       // r,g,b of the blue (taken from your new swatch, #649FFF). Used by the line, the glow, the button and the cursor

/* ---------- Custom cursor ---------- */

// ---- tweak these ----
const CURSOR_DOT = 8;             // size of the dot in px
const CURSOR_RING = 38;           // size of the ring in px
const CURSOR_FOLLOW = 9;          // how quickly the ring catches up with the dot (lower = lazier, more delay)
const CURSOR_HOVER_SCALE = 1.7;   // the ring grows this much over links and buttons (1 = never grows)


// hide the normal arrow (only on devices with a real mouse); it comes back when you leave this page
const CURSOR_CSS = `
@media (hover: hover) and (pointer: fine) {
  html, html * { cursor: none !important; }
}
.cursor-dot, .cursor-ring { transition: background-color .25s ease, border-color .25s ease, box-shadow .25s ease; }
`;

// the "Contact me" button: dark blue-tinted box, blue border, monospace text
// the marker circle: drawn round its word over about a second, each time the "who am i" page comes up
const MARKER_CSS = `
.marker { position: relative; display: inline-block; white-space: nowrap; }
.marker svg { position: absolute; left: -0.45em; right: -0.45em; top: -0.32em; bottom: -0.38em; width: calc(100% + 0.9em); height: calc(100% + 0.7em); overflow: visible; pointer-events: none; }
.marker path { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset .1s linear; }
.marker.drawn path { stroke-dashoffset: 0; transition: stroke-dashoffset 1s cubic-bezier(.55,.1,.35,1) .35s; }
@media (prefers-reduced-motion: reduce) { .marker path, .marker.drawn path { stroke-dashoffset: 0; transition: none; } }
`;

const CONTACT_CSS = `
.contact-btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .5rem 1rem;
  border-radius: .5rem;
  border: 1px solid rgba(${BLUE}, .75);
  background: rgba(${BLUE}, .14);
  color: #e9edf9;
  font-family: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .875rem;
  letter-spacing: .01em;
  text-decoration: none;
  transition: transform .3s ease, background .3s ease, border-color .3s ease, box-shadow .3s ease;
}
.contact-arrow { width: 1em; height: 1em; flex-shrink: 0; transition: transform .3s ease; }
.contact-btn:hover .contact-arrow, .contact-btn:focus-visible .contact-arrow { transform: translate(2px, -2px); }
.contact-btn:hover, .contact-btn:focus-visible {
  transform: translateY(-2px);
  background: rgba(${BLUE}, .3);
  border-color: rgb(${BLUE});
  box-shadow: 0 0 28px rgba(${BLUE}, .4);
  outline: none;
}
`;

// make the whole page (and anything on it that uses plain black) the same black
const BG_CSS = `
html, body, .bg-black { background-color: rgb(${PAGE_BLACK}) !important; }
`;

// small up-right arrow shown on the Résumé and Contact me buttons
function ArrowUpRight() {
  return (
    <svg viewBox="0 0 24 24" className="contact-arrow" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const dot = dotRef.current, ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -100, my = -100;   // the mouse (the dot sits exactly here)
    let rx = -100, ry = -100;   // the ring, which drifts after it
    let sc = 1, hover = false, down = false, seen = false;
    let raf = 0, last = performance.now(), lastDot = "", lastRing = "";

    const show = (on: boolean) => {
      dot.style.opacity = on ? "1" : "0";
      ring.style.opacity = on ? "1" : "0";
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mx = e.clientX;
      my = e.clientY;
      if (!seen) {
        seen = true;
        rx = mx; ry = my; // appear in place instead of flying in from the corner
        show(true);
      }
      const t = e.target as Element | null;
      hover = !!t?.closest?.("a, button, [role='button'], input, textarea, select, label, summary");
    };
    const onLeave = () => { seen = false; show(false); };
    const onDown = () => { down = true; };
    const onUp = () => { down = false; };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // the ring eases towards the dot, so it lags while you move and settles when you stop
      const k = 1 - Math.exp(-dt * CURSOR_FOLLOW);
      rx += (mx - rx) * k;
      ry += (my - ry) * k;
      const want = (hover ? CURSOR_HOVER_SCALE : 1) * (down ? 0.8 : 1);
      sc += (want - sc) * (1 - Math.exp(-dt * 14));

      // only touch the page when the cursor has actually moved
      const d = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
      const r = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0) translate(-50%,-50%) scale(${sc.toFixed(3)})`;
      if (d !== lastDot) { dot.style.transform = d; lastDot = d; }
      if (r !== lastRing) { ring.style.transform = r; lastRing = r; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const base: CSSProperties = {
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 10001,
    pointerEvents: "none",
    borderRadius: "9999px",
    opacity: 0,
    willChange: "transform",
    transition: "opacity .25s ease",
  };
  return (
    <>
      <div ref={ringRef} aria-hidden="true" className="cursor-ring" style={{ ...base, width: CURSOR_RING, height: CURSOR_RING, border: "1px solid rgba(255,255,255,.4)" }} />
      <div ref={dotRef} aria-hidden="true" className="cursor-dot" style={{ ...base, width: CURSOR_DOT, height: CURSOR_DOT, background: `rgb(${BLUE})`, boxShadow: `0 0 10px rgba(${BLUE},.9)` }} />
    </>
  );
}

/* ---------- Wall intro: break through a concrete wall when you first arrive ---------- */

// ---- tweak these ----
const WALL_HITS = 3;                  // hits it takes to break through (keep it at 4 or less). Each one knocks a big chunk out
const WALL_PROMPT = "break the wall";       // the big text in the middle
const WALL_PROMPT_TOUCH = "break the wall"; // the same text on phones and tablets
const WALL_HOLE_SIZE = 1;             // how big the chunk knocked out by each hit is (1 = normal, 1.5 = half as big again)
const WALL_HIT_AREA = 0.15;           // where the wall can be broken: within this far of the middle (0.15 = 15% of the screen's smaller side).
                                      // A click further out still hits, just pulled in to the edge of that area
const WALL_ZOOM_DELAY = 0.2;          // after the last hit, how long it waits before flying through the opening (seconds)
const WALL_ZOOM_TIME = 0.9;           // how long the fly-through takes (seconds)
const WALL_COLOR = "#0f1012";         // the colour of the wall (black)
const WALL_TEXT_COLOR = "#f5f5f3";    // the colour of the "break the wall" text (white)

const WALL_CSS = `
/* no normal arrow on the wall: only the dot and ring cursor shows */
.wall-root, .wall-root * { cursor: none !important; }
`;

// Module level on purpose: it survives clicking around the site (so the "wingwang" logo doesn't bring the
// wall back) but starts fresh every time the page is loaded from scratch (a new visit, a new tab, a refresh).
let introSeen = false;

function shouldPlayIntro(): boolean {
  if (introSeen) return false;
  try {
    // only when you arrived on the home page (if you landed on /photos and clicked "wingwang" later: no wall)
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav && new URL(nav.name).pathname !== "/") return false;
  } catch {}
  return true;
}

type Pt = { x: number; y: number };
type Branch = { at: number; pts: Pt[]; cum: number[]; len: number };
type Ray = { pts: Pt[]; cum: number[]; len: number; branches: Branch[] };
type Star = { x: number; y: number; hit: number; rays: Ray[] };
// one piece of the broken-up wall: its outline, and which piece is on the other side of each edge
type Cell = { pts: Pt[]; nb: number[]; cx: number; cy: number; d: number; tint: number };
// the pieces around one hit. out[i] = that piece has come out of the wall
type Patch = { x: number; y: number; hit: number; cells: Cell[]; out: boolean[]; rc: number; depth: number; final: boolean };
// a solid chunk flying through the air: a flat outline with a thickness, a position, a spin and a speed
type Chunk = {
  pts: Pt[]; nrm: Pt[]; h: number;
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  rx: number; ry: number; rz: number; wx: number; wy: number; wz: number;
  life: number; max: number; tone: number; side: number; far: boolean; g: number; // g = how heavy it falls (1 = normal)
};
type Puff = { x: number; y: number; vx: number; vy: number; r: number; grow: number; life: number; max: number };

// a small seeded random number generator, so a crack pattern is the same every time it is redrawn
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// one set of cracks spreading out from where the wall was hit (a star of jagged lines, with side branches)
function makeStar(x: number, y: number, hit: number, seed: number, scale: number): Star {
  const r = rng(seed);
  const walk = (sx: number, sy: number, ang: number, len: number) => {
    const pts: Pt[] = [{ x: sx, y: sy }];
    const cum = [0];
    let px = sx, py = sy, a = ang, d = 0;
    while (d < len) {
      const step = 14 + r() * 22;
      a += (r() - 0.5) * 0.7;
      px += Math.cos(a) * step;
      py += Math.sin(a) * step;
      d += step;
      pts.push({ x: px, y: py });
      cum.push(d);
    }
    return { pts, cum, len: d };
  };

  const n = 5 + Math.floor(r() * 3);
  const off = r() * Math.PI * 2;
  const rays: Ray[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = off + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
    const main = walk(x, y, a0, (200 + r() * 320) * scale);
    const branches: Branch[] = [];
    const nb = 1 + Math.floor(r() * 3);
    for (let b = 0; b < nb; b++) {
      const target = (0.25 + r() * 0.55) * main.len;
      let k = 1;
      while (k < main.cum.length - 1 && main.cum[k] < target) k++;
      const base = main.pts[k];
      const ang = a0 + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.7);
      const br = walk(base.x, base.y, ang, main.len * (0.25 + r() * 0.3));
      branches.push({ at: main.cum[k] / main.len, ...br });
    }
    rays.push({ ...main, branches });
  }
  return { x, y, hit, rays };
}

// draw the first `maxLen` pixels of a jagged line, getting thinner towards the end
function strokePartial(ctx: CanvasRenderingContext2D, pts: Pt[], cum: number[], maxLen: number, w0: number, w1: number) {
  const total = cum[cum.length - 1] || 1;
  let prev = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const t0 = cum[i - 1], t1 = cum[i];
    if (t0 >= maxLen) break;
    let q = pts[i];
    if (t1 > maxLen) {
      const u = (maxLen - t0) / (t1 - t0);
      q = { x: prev.x + (q.x - prev.x) * u, y: prev.y + (q.y - prev.y) * u };
    }
    ctx.lineWidth = w0 + (w1 - w0) * (t0 / total);
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
    prev = pts[i];
  }
}

// ---- the 3D part ----
// The wall is drawn on a flat canvas, but the pieces are worked out in 3D and then squashed onto the screen
// with perspective (things further away are drawn smaller). x goes right, y goes down, z goes INTO the screen.
const WALL_FOCAL = 560;                             // how strong the perspective is (lower = more dramatic)
const WALL_LIGHT = { x: -0.42, y: -0.62, z: -0.66 }; // the light comes from the top left, in front of the wall
const WALL_GRAVITY = 1500;
const WALL_CRUMBLE = 2.6;                           // how fast the wall's chunks drop at the end (1 = normal gravity, higher = heavier)
const WALL_MAX_PIXELS = 1_700_000;                    // lower = runs faster, a little less sharp

// Break the area around (x, y) into pieces, the way real concrete shatters: small pieces near the hit,
// bigger ones further out. (This is a Voronoi pattern: every piece is the area closest to one random point.)
// spacing = the smallest gap between piece centres, as a share of the radius (smaller = more, smaller pieces)
function makeCells(x: number, y: number, radius: number, count: number, power: number, r: () => number, spacing = 0.085): Cell[] {
  const sites: Pt[] = [{ x: x + (r() - 0.5) * radius * 0.06, y: y + (r() - 0.5) * radius * 0.06 }];
  const minD = radius * spacing;
  let tries = 0;
  while (sites.length < count && tries < count * 12) {
    tries++;
    const a = r() * Math.PI * 2, rr = radius * Math.pow(r(), power);
    const p = { x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr };
    let ok = true;
    for (const s of sites) if (Math.hypot(s.x - p.x, s.y - p.y) < minD) { ok = false; break; }
    if (ok) sites.push(p);
  }
  const inner = sites.length;
  // a ring of extra points around the outside, only there to close off the outer pieces
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + r() * 0.2, rr = radius * (1.22 + r() * 0.1);
    sites.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr });
  }

  const half = radius * 2;
  const cells: Cell[] = [];
  for (let i = 0; i < inner; i++) {
    const s = sites[i];
    let poly: { x: number; y: number; nb: number }[] = [
      { x: x - half, y: y - half, nb: -1 }, { x: x + half, y: y - half, nb: -1 },
      { x: x + half, y: y + half, nb: -1 }, { x: x - half, y: y + half, nb: -1 },
    ];
    for (let j = 0; j < sites.length && poly.length > 2; j++) {
      if (j === i) continue;
      const o = sites[j];
      const dx = o.x - s.x, dy = o.y - s.y, mx = (o.x + s.x) / 2, my = (o.y + s.y) / 2;
      const side = (p: Pt) => (p.x - mx) * dx + (p.y - my) * dy; // above 0 = closer to the other point: cut it off
      const next: { x: number; y: number; nb: number }[] = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k], b = poly[(k + 1) % poly.length];
        const fa = side(a), fb = side(b);
        if (fa <= 0) {
          next.push(a);
          if (fb > 0) { const u = fa / (fa - fb); next.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, nb: j }); }
        } else if (fb <= 0) {
          const u = fa / (fa - fb);
          next.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, nb: a.nb });
        }
      }
      poly = next;
    }
    let cx = 0, cy = 0;
    for (const p of poly) { cx += p.x; cy += p.y; }
    cx /= Math.max(1, poly.length);
    cy /= Math.max(1, poly.length);
    cells.push({
      pts: poly.map((p) => ({ x: p.x, y: p.y })),
      nb: poly.map((p) => (p.nb >= inner ? -1 : p.nb)),
      cx, cy, d: Math.hypot(s.x - x, s.y - y), tint: r(),
    });
  }
  return cells;
}

// one outline made of all the pieces that have come out
function cellsPath(cells: Cell[], out: boolean[]): Path2D {
  const path = new Path2D();
  cells.forEach((c, i) => {
    if (!out[i] || c.pts.length < 3) return;
    c.pts.forEach((p, k) => { if (k) path.lineTo(p.x, p.y); else path.moveTo(p.x, p.y); });
    path.closePath();
  });
  return path;
}

// The inside edge of an opening: the thickness of the wall that you can see once pieces have come out.
// Each bit of edge is shaded by which way it faces (bright if it faces the light, dark if it faces away).
// `inset` says where the back of the wall is for a point on the front.
// `gone` says if a point is already open from another hole: the edge there has no wall left, so it isn't drawn
function drawRim(ctx: CanvasRenderingContext2D, cells: Cell[], out: boolean[], cx: number, cy: number, inset: (p: Pt) => Pt, gone?: (x: number, y: number) => boolean) {
  ctx.lineJoin = "round";
  for (let i = 0; i < cells.length; i++) {
    if (!out[i]) continue;
    const c = cells[i], n = c.pts.length;
    for (let k = 0; k < n; k++) {
      const j = c.nb[k];
      if (j >= 0 && out[j]) continue; // the piece next door is gone too: no wall left between them
      const a = c.pts[k], b = c.pts[(k + 1) % n];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      let nx = b.y - a.y, ny = a.x - b.x;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      if (nx * (c.cx - mx) + ny * (c.cy - my) < 0) { nx = -nx; ny = -ny; } // point it into the opening
      if (nx * (cx - mx) + ny * (cy - my) <= 0) continue;                  // facing away from the viewer
      if (gone && gone(mx - nx * 3, my - ny * 3)) continue;                 // the wall behind this edge is already gone
      const a2 = inset(a), b2 = inset(b);
      const lit = 0.5 + 0.5 * (nx * -0.6 + ny * -0.8);
      const v1 = Math.round(30 + 75 * lit), v2 = Math.round(v1 * 0.55);
      const g = ctx.createLinearGradient(mx, my, (a2.x + b2.x) / 2, (a2.y + b2.y) / 2);
      g.addColorStop(0, `rgb(${v1},${v1},${v1 + 2})`);
      g.addColorStop(1, `rgb(${v2},${v2},${v2 + 3})`);
      ctx.fillStyle = g;
      ctx.strokeStyle = g;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(b2.x, b2.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // a crisp line where the front of the wall ends
      ctx.strokeStyle = "rgba(200,202,206,.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

// Every hit shatters the area around it, and the damage from the earlier hits spreads further too.
function drawCracks(ctx: CanvasRenderingContext2D, stars: Star[], patches: Patch[], hits: number, W: number, H: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // long cracks running away from each hit
  for (const s of stars) {
    const age = hits - s.hit;
    const f = Math.min(1, 0.3 + 0.2 * age + 0.12 * (s.hit - 1)); // how much of each crack is showing
    const pass = (dx: number, dy: number, color: string, k: number) => {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.strokeStyle = color;
      for (const ray of s.rays) {
        strokePartial(ctx, ray.pts, ray.cum, f * ray.len, 2.4 * k, 0.5 * k);
        for (const br of ray.branches) {
          if (f > br.at) strokePartial(ctx, br.pts, br.cum, Math.min(br.len, (f - br.at) * ray.len * 1.2), 1.6 * k, 0.4 * k);
        }
      }
      ctx.restore();
    };
    pass(1.4, 1.8, "rgba(0,0,0,.6)", 1);      // a soft shadow under the crack
    pass(0, 0, "rgba(225,227,230,.8)", 1);   // the crack itself (light, so it shows on the black wall)
  }

  for (const p of patches) {
    const age = hits - p.hit;
    const reach = p.final ? p.rc * 1.5 : p.rc * (2 + 0.65 * age); // how far the shattering spreads

    // loose pieces sit at slightly different angles, so each one catches the light a little differently
    p.cells.forEach((c, i) => {
      const near = 1 - c.d / (reach * 0.8);
      if (p.out[i] || near <= 0 || c.pts.length < 3) return;
      const a = near * near * (0.02 + 0.085 * c.tint);
      ctx.fillStyle = `rgba(230,232,236,${(a * 0.6).toFixed(3)})`;
      ctx.beginPath();
      c.pts.forEach((q, k) => { if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
      ctx.closePath();
      ctx.fill();
    });

    // the cracks between the pieces: strong near the hit, fading out further away
    const segs: { a: Pt; b: Pt; s: number }[] = [];
    p.cells.forEach((c, i) => {
      const n = c.pts.length;
      for (let k = 0; k < n; k++) {
        const j = c.nb[k];
        if (j >= 0 && j < i) continue;               // already drawn from the other side
        if (p.out[i] && j >= 0 && p.out[j]) continue; // inside the crater
        const a = c.pts[k], b = c.pts[(k + 1) % n];
        const d = Math.hypot((a.x + b.x) / 2 - p.x, (a.y + b.y) / 2 - p.y);
        if (d >= reach) continue;
        segs.push({ a, b, s: Math.pow(1 - d / reach, 1.15) });
      }
    });
    for (const sg of segs) {
      ctx.strokeStyle = `rgba(0,0,0,${(0.5 * sg.s).toFixed(3)})`;
      ctx.lineWidth = 0.8 + 2 * sg.s;
      ctx.beginPath();
      ctx.moveTo(sg.a.x + 1.3, sg.a.y + 1.7);
      ctx.lineTo(sg.b.x + 1.3, sg.b.y + 1.7);
      ctx.stroke();
    }
    for (const sg of segs) {
      ctx.strokeStyle = `rgba(225,227,230,${(0.15 + 0.6 * sg.s).toFixed(3)})`;
      ctx.lineWidth = 0.6 + 1.7 * sg.s;
      ctx.beginPath();
      ctx.moveTo(sg.a.x, sg.a.y);
      ctx.lineTo(sg.b.x, sg.b.y);
      ctx.stroke();
    }

  }
}

// turn an outline on the wall into a solid chunk (its points are stored around its own middle)
function makeBody(pts: Pt[], cx: number, cy: number, h: number): Chunk {
  const local = pts.map((p) => ({ x: p.x - cx, y: p.y - cy }));
  const nrm = local.map((a, k) => {
    const b = local[(k + 1) % local.length];
    let nx = b.y - a.y, ny = a.x - b.x;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    if (nx * (a.x + b.x) + ny * (a.y + b.y) < 0) { nx = -nx; ny = -ny; } // point outwards
    return { x: nx, y: ny };
  });
  return {
    pts: local, nrm, h, x: cx, y: cy, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, wx: 0, wy: 0, wz: 0,
    life: 1, max: 1, tone: 22, side: 70, far: false, g: 1,
  };
}

// Draw one chunk: spin it, move it, squash it onto the screen with perspective, then paint only the faces
// that point at the viewer, each one lit by how much it faces the light. (vx, vy) is where the viewer looks.
function drawBody(ctx: CanvasRenderingContext2D, b: Chunk, vx: number, vy: number) {
  const F = WALL_FOCAL;
  const cx = Math.cos(b.rx), sx = Math.sin(b.rx), cy = Math.cos(b.ry), sy = Math.sin(b.ry), cz = Math.cos(b.rz), sz = Math.sin(b.rz);
  const m00 = cz * cy, m01 = cz * sy * sx - sz * cx, m02 = cz * sy * cx + sz * sx;
  const m10 = sz * cy, m11 = sz * sy * sx + cz * cx, m12 = sz * sy * cx - cz * sx;
  const m20 = -sy, m21 = cy * sx, m22 = cy * cx;
  const n = b.pts.length, hh = b.h / 2;
  if (n < 3) return;

  // where every corner ends up on the screen (front corners first, then the back ones)
  const X: number[] = [], Y: number[] = [];
  for (let side = 0; side < 2; side++) {
    const lz = side === 0 ? -hh : hh;
    for (let i = 0; i < n; i++) {
      const p = b.pts[i];
      const wx = b.x + m00 * p.x + m01 * p.y + m02 * lz;
      const wy = b.y + m10 * p.x + m11 * p.y + m12 * lz;
      const wz = b.z + m20 * p.x + m21 * p.y + m22 * lz;
      if (F + wz < 40) return; // right in the viewer's face: skip it
      const s = F / (F + wz);
      X.push(vx + (wx - vx) * s);
      Y.push(vy + (wy - vy) * s);
    }
  }

  const fade = Math.min(1, b.life / 0.35);
  const fog = Math.min(1, Math.max(0, b.z / 2600)) * 0.88; // far away pieces sink into the dark
  ctx.globalAlpha = fade;
  ctx.lineWidth = 0.7;
  ctx.lineJoin = "round";

  // is this face pointing at the viewer? (nx,ny,nz = which way it faces, px,py,pz = a point on it)
  const face = (idx: number[], base: number, nx: number, ny: number, nz: number, px: number, py: number, pz: number) => {
    const wnx = m00 * nx + m01 * ny + m02 * nz, wny = m10 * nx + m11 * ny + m12 * nz, wnz = m20 * nx + m21 * ny + m22 * nz;
    const wx = b.x + m00 * px + m01 * py + m02 * pz, wy = b.y + m10 * px + m11 * py + m12 * pz, wz = b.z + m20 * px + m21 * py + m22 * pz;
    if (wnx * (wx - vx) + wny * (wy - vy) + wnz * (wz + F) >= 0) return;
    const lam = Math.max(0, wnx * WALL_LIGHT.x + wny * WALL_LIGHT.y + wnz * WALL_LIGHT.z);
    const v = base * Math.min(1, 0.36 + lam);
    const cr = Math.round(v * (1 - fog) + 11 * fog), cg = Math.round(v * (1 - fog) + 13 * fog), cb = Math.round((v - 2) * (1 - fog) + 15 * fog);
    ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
    ctx.beginPath();
    idx.forEach((q, k) => { if (k) ctx.lineTo(X[q], Y[q]); else ctx.moveTo(X[q], Y[q]); });
    ctx.closePath();
    ctx.fill();
  };

  const front: number[] = [], back: number[] = [];
  for (let i = 0; i < n; i++) { front.push(i); back.push(n + i); }
  face(back, b.side + 14, 0, 0, 1, 0, 0, hh);
  for (let i = 0; i < n; i++) {
    const k = (i + 1) % n;
    face([i, k, n + k, n + i], b.side, b.nrm[i].x, b.nrm[i].y, 0, (b.pts[i].x + b.pts[k].x) / 2, (b.pts[i].y + b.pts[k].y) / 2, 0);
  }
  face(front, b.tone, 0, 0, -1, 0, 0, -hh);
  ctx.globalAlpha = 1;
}

// paint a clean black concrete wall: near black with only a faint grain and a few deeper black patches
function paintWall(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const r = rng(1234);
  ctx.fillStyle = WALL_COLOR;
  ctx.fillRect(0, 0, W, H);

  // a few soft deep-black patches
  for (let i = 0; i < 40; i++) {
    const x = r() * W, y = r() * H, rad = 140 + r() * 320;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, "rgba(0,0,0,.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  // very fine, very faint grain so it still reads as concrete
  const tile = document.createElement("canvas");
  tile.width = tile.height = 192;
  const tctx = tile.getContext("2d");
  if (tctx) {
    const img = tctx.createImageData(192, 192);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 20 + r() * 40;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 38;
    }
    tctx.putImageData(img, 0, 0);
    const pat = ctx.createPattern(tile, "repeat");
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // the faintest shading towards the corners
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.78);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,.35)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

// is point (x, y) inside this outline?
function inPoly(pts: Pt[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

// A black concrete wall covers the screen, with the camera behind it. Click it: each hit knocks a big chunk
// clean out of the wall (with real wall thickness around the edge), and the pieces tumble down towards you.
// Only the middle can be broken. After the last hit it flies you through the opening by itself, onto the site.
// (Esc skips it: the whole wall crumbles.)
function startWall(
  root: HTMLDivElement, canvas: HTMLCanvasElement, prompt: HTMLDivElement, promptText: HTMLParagraphElement,
  onBreak: () => void, onDone: () => void,
): () => void {
  const wallC = document.createElement("canvas");  // the plain wall
  const crackC = document.createElement("canvas"); // the cracks
  const flatC = document.createElement("canvas");  // the wall with the damage already painted on (one picture = fast to draw)
  const farC = document.createElement("canvas");   // bits falling away behind the wall (only seen through the holes)
  const ctx = canvas.getContext("2d");
  const wctx = wallC.getContext("2d"), cctx = crackC.getContext("2d"), fctx = flatC.getContext("2d"), farx = farC.getContext("2d");
  if (!ctx || !wctx || !cctx || !fctx || !farx) {
    // can't draw here: skip the intro rather than trap the visitor behind a blank wall
    onBreak();
    onDone();
    return () => {};
  }

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  promptText.textContent = coarse ? WALL_PROMPT_TOUCH : WALL_PROMPT;

  // a soft round blob of dust, drawn once and reused
  const dustC = document.createElement("canvas");
  dustC.width = dustC.height = 64;
  const dctx = dustC.getContext("2d");
  if (dctx) {
    const g = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(150,152,156,.35)");
    g.addColorStop(0.5, "rgba(150,152,156,.12)");
    g.addColorStop(1, "rgba(150,152,156,0)");
    dctx.fillStyle = g;
    dctx.fillRect(0, 0, 64, 64);
  }

  // a hole punched through the wall. k = how much smaller the back of the hole looks than the front
  type Hole = { patch: Patch; path: Path2D; k: number };
  // the last hit: the whole wall in pieces, and when each piece lets go
  type Collapse = { patch: Patch; order: number[]; when: number[]; next: number; t: number; path: Path2D | null; k: number; thick: number };

  let W = 0, H = 0, dpr = 1;
  const stars: Star[] = [];
  const patches: Patch[] = [];
  const bodies: Chunk[] = [];
  const puffs: Puff[] = [];
  const holes: Hole[] = [];
  let collapse: Collapse | null = null;
  let hits = 0, busy = false, broken = false, gone = false, finished = false, dirty = true;
  let shakeT = 0, shakeAmp = 0;
  let px = 0, py = 0; // where the pointer last was (for Enter / Space)
  // flying through: whether it has started, how far it has got (pass, 0 to 1),
  // the point it flies towards (fx, fy) and how much it has to zoom for the opening to fill the screen
  let flying = false, flyT = 0, pass = 0, fx = 0, fy = 0, zoomTo = 1;
  // is (x, y) open in this hole?
  const openAt = (h: Hole, x: number, y: number) => h.patch.cells.some((c, i) => h.patch.out[i] && c.pts.length >= 3 && inPoly(c.pts, x, y));
  const timers: number[] = [];
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  // where the back edge of a hole ends up: pulled a little towards the middle of the screen (perspective)
  const inset = (k: number) => (q: Pt): Pt => ({ x: W / 2 + (q.x - W / 2) * k, y: H / 2 + (q.y - H / 2) * k });

  const redrawCracks = () => {
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCracks(cctx, stars, patches, hits, W, H);
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.drawImage(wallC, 0, 0);
    fctx.drawImage(crackC, 0, 0);
  };

  const setup = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    // keep the number of pixels down: big sharp screens are what made each hit lag
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(WALL_MAX_PIXELS / Math.max(1, W * H))));
    for (const c of [canvas, wallC, crackC, flatC, farC]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintWall(wctx, W, H);
    redrawCracks();
    dirty = true;
  };

  const spawnPuffs = (x: number, y: number, n: number, spread: number) => {
    for (let i = 0; i < n && puffs.length < 36; i++) {
      const a = Math.random() * Math.PI * 2, sp = Math.random() * spread;
      const max = rand(0.8, 1.5);
      puffs.push({
        x: x + rand(-10, 10), y: y + rand(-10, 10),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        r: rand(16, 44), grow: rand(50, 140), life: max, max,
      });
    }
  };

  // small solid bits of concrete that fly out towards you and drop
  const spawnChips = (x: number, y: number, n: number, power: number) => {
    for (let i = 0; i < n && bodies.length < 70; i++) {
      const size = rand(3, 10) * (Math.random() < 0.15 ? 1.8 : 1);
      const corners = 4 + Math.floor(Math.random() * 3);
      const pts: Pt[] = [];
      for (let k = 0; k < corners; k++) {
        const a = (k / corners) * Math.PI * 2 + rand(-0.25, 0.25), rr = size * rand(0.65, 1.1);
        pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
      }
      const b = makeBody(pts, 0, 0, size * rand(0.5, 1.1));
      const a = -Math.PI / 2 + rand(-1, 1) * Math.PI * 0.75, sp = rand(120, 520) * power;
      b.x = x + rand(-8, 8);
      b.y = y + rand(-8, 8);
      b.z = -b.h;
      b.vx = Math.cos(a) * sp;
      b.vy = Math.sin(a) * sp;
      b.vz = -rand(50, 300);
      b.rx = rand(0, 6); b.ry = rand(0, 6); b.rz = rand(0, 6);
      b.wx = rand(-9, 9); b.wy = rand(-9, 9); b.wz = rand(-6, 6);
      b.max = b.life = rand(0.7, 1.1);
      b.tone = rand(18, 34);
      b.side = rand(50, 90);
      bodies.push(b);
    }
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    onDone();
  };

  // a hit: a big chunk of the wall breaks clean out, in a few large pieces that tip towards you and drop
  const punch = (x: number, y: number, size: number) => {
    const rc = (95 + 30 * hits) * size * WALL_HOLE_SIZE;
    // few, large pieces (spacing 0.2 = big chunks), so it breaks into slabs instead of gravel
    const cells = makeCells(x, y, rc * 2.1, 30, 1.0, rng(5000 + hits * 71 + Math.floor(x * 3 + y * 7)), 0.2);
    const patch: Patch = { x, y, hit: hits, cells, out: cells.map((c) => c.pts.length >= 3 && c.d < rc), rc, depth: 0, final: false };
    patches.push(patch);
    const thick = 40 * size;
    holes.push({ patch, path: cellsPath(cells, patch.out), k: WALL_FOCAL / (WALL_FOCAL + thick) });
    cells.forEach((c, i) => {
      if (!patch.out[i]) return;
      const b = makeBody(c.pts, c.cx, c.cy, thick);
      const dx = c.cx - x, dy = c.cy - y, d = Math.hypot(dx, dy) || 1;
      b.z = thick / 2; // its front starts level with the front of the wall
      b.vx = (dx / d) * rand(40, 180);
      b.vy = (dy / d) * rand(20, 120) - rand(40, 160); // a small pop up, then it drops
      b.vz = -rand(120, 320);                           // towards you
      b.wx = rand(-2.6, 2.6); b.wy = rand(-2.6, 2.6); b.wz = rand(-1.6, 1.6);
      b.g = WALL_CRUMBLE * 0.8;
      b.max = b.life = 1.8;
      b.tone = rand(18, 32);
      b.side = rand(50, 85);
      bodies.push(b);
    });
  };

  // How far the opening reaches from (x, y) in every direction: the nearest point of its edge.
  // That says how much the view has to zoom in for the opening to cover the whole screen.
  const reachFrom = (h: Hole, x: number, y: number) => {
    let best = Infinity;
    h.patch.cells.forEach((c, i) => {
      if (!h.patch.out[i]) return;
      const n = c.pts.length;
      for (let k = 0; k < n; k++) {
        const j = c.nb[k];
        if (j >= 0 && h.patch.out[j]) continue; // not an edge of the opening
        const a = c.pts[k], b = c.pts[(k + 1) % n];
        const ex = b.x - a.x, ey = b.y - a.y, l2 = ex * ex + ey * ey || 1;
        const t = Math.max(0, Math.min(1, ((x - a.x) * ex + (y - a.y) * ey) / l2));
        best = Math.min(best, Math.hypot(a.x + ex * t - x, a.y + ey * t - y));
      }
    });
    return best;
  };

  // the wall is broken: pick the biggest opening and fly through it
  const getReady = () => {
    let bestR = 0;
    for (const h of holes) {
      const r = reachFrom(h, h.patch.x, h.patch.y);
      if (r > bestR) { bestR = r; fx = h.patch.x; fy = h.patch.y; }
    }
    zoomTo = (Math.hypot(W, H) / 2 / Math.max(20, bestR)) * 1.35;
    flying = true;
    dirty = true;
  };

  // one piece of the wall lets go: it tips towards you and drops off the screen
  const release = (i: number) => {
    if (!collapse) return;
    const p = collapse.patch, c = p.cells[i];
    p.out[i] = true;
    // a piece that was mostly a hole already has nothing left to fall
    if (holes.some((h) => h.patch.cells.some((hc, j) => h.patch.out[j] && hc.pts.length >= 3 && inPoly(hc.pts, c.cx, c.cy)))) return;
    const dx = c.cx - p.x, dy = c.cy - p.y, d = Math.hypot(dx, dy) || 1;
    const b = makeBody(c.pts, c.cx, c.cy, collapse.thick);
    b.z = collapse.thick / 2;
    // no upward pop: it just lets go and drops, tipping forward a little
    b.vx = (dx / d) * rand(10, 90);
    b.vy = rand(60, 220);
    b.vz = rand(-40, 30);
    b.wx = rand(-0.9, 0.9); b.wy = rand(-0.6, 0.6); b.wz = rand(-0.8, 0.8);
    b.g = WALL_CRUMBLE;
    b.max = b.life = 1.6;
    b.tone = rand(18, 30);
    b.side = rand(50, 80);
    bodies.push(b);
    if (Math.random() < 0.05) spawnPuffs(c.cx, c.cy, 1, 80);
  };

  // the last hit: cracks run across the whole wall and it crumbles, starting where you clicked
  const breakWall = (x: number, y: number) => {
    if (broken) return;
    broken = true;
    dirty = true;
    const far = Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y));
    const size = Math.max(0.7, Math.min(1.25, Math.min(W, H) / 800));
    const cells = makeCells(x, y, far * 1.25, 170, 1.1, rng(4242 + Math.floor(x * 5 + y * 11)), 0.05);
    const order: number[] = [], when: number[] = [];
    cells.forEach((c, i) => {
      when.push((c.d / far) * 0.28); // the break spreads outwards from the hit
      const onScreen = c.pts.some((q) => q.x > -50 && q.x < W + 50 && q.y > -50 && q.y < H + 50);
      if (c.pts.length >= 3 && onScreen) order.push(i);
    });
    order.sort((a, b) => when[a] - when[b]);
    const patch: Patch = { x, y, hit: hits, cells, out: cells.map(() => false), rc: far, depth: 0, final: true };
    patches.push(patch);
    const thick = 40 * size;
    collapse = { patch, order, when, next: 0, t: 0, path: null, k: WALL_FOCAL / (WALL_FOCAL + thick), thick };
    redrawCracks();
    root.style.background = "transparent";
    root.style.pointerEvents = "none";
    prompt.style.opacity = "0";
    spawnPuffs(x, y, 4, 200);
    spawnChips(x, y, 10, 0.8);
    shakeT = 0.3;
    shakeAmp = 12;
    onBreak();
  };

  // a hit: a hole, shattered concrete around it, flying chips, a shake and a thud
  const impact = (x: number, y: number) => {
    hits++;
    const last = hits >= WALL_HITS;
    const size = Math.max(0.7, Math.min(1.25, Math.min(W, H) / 800));
    stars.push(makeStar(x, y, hits, 9000 + hits * 131 + Math.floor(x * 7 + y * 3), 0.85 + 0.12 * (hits - 1)));
    root.style.background = "transparent"; // from now on the page shows through the holes
    punch(x, y, size);
    redrawCracks();
    spawnChips(x, y, 8 + hits * 3, 1.1);
    spawnPuffs(x, y, 3 + hits, 170);
    shakeT = 0.26;
    shakeAmp = 7 + hits * 3;
    prompt.style.opacity = "0";
    dirty = true;
    if (last) timers.push(window.setTimeout(getReady, WALL_ZOOM_DELAY * 1000));
  };

  const doHit = (x: number, y: number) => {
    if (busy || broken || hits >= WALL_HITS) return;
    // only the middle of the wall can be broken: a click further out is pulled in to the edge of that area
    const lim = Math.min(W, H) * WALL_HIT_AREA, dx = x - W / 2, dy = y - H / 2, d = Math.hypot(dx, dy);
    if (d > lim) { x = W / 2 + (dx / d) * lim; y = H / 2 + (dy / d) * lim; }
    busy = true;
    impact(x, y);
    timers.push(window.setTimeout(() => { busy = false; }, 140));
  };

  const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; };
  const onDown = (e: PointerEvent) => {
    px = e.clientX;
    py = e.clientY;
    doHit(e.clientX, e.clientY);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (!broken) breakWall(W / 2, H / 2);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      doHit(px, py);
    }
  };
  const onResize = () => { if (!broken) setup(); };

  const update = (dt: number) => {
    if (shakeT > 0) { shakeT -= dt; dirty = true; }
    if (flying && !broken && pass < 1) {
      flyT += dt / WALL_ZOOM_TIME;
      pass = flyT >= 1 ? 1 : smooth(0, 1, flyT);
      canvas.style.opacity = String(1 - smooth(0.82, 1, pass)); // the last of the wall fades as it goes past you
      dirty = true;
      if (pass >= 1) {
        root.style.pointerEvents = "none";
        onBreak();
        finish();
      }
    }
    for (let i = bodies.length - 1; i >= 0; i--) {
      const b = bodies[i];
      b.life -= dt;
      if (b.life <= 0 || WALL_FOCAL + b.z < 60 || (!b.far && b.y > H + 200)) { bodies.splice(i, 1); continue; }
      b.vy += WALL_GRAVITY * b.g * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.rx += b.wx * dt;
      b.ry += b.wy * dt;
      b.rz += b.wz * dt;
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.life -= dt;
      if (p.life <= 0) { puffs.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += p.grow * dt;
    }
    if (collapse) {
      const c = collapse;
      c.t += dt;
      dirty = true;
      let changed = false;
      while (c.next < c.order.length && c.when[c.order[c.next]] <= c.t) {
        release(c.order[c.next++]);
        changed = true;
      }
      if (changed) c.path = cellsPath(c.patch.cells, c.patch.out);
      if (!gone && c.next >= c.order.length) {
        gone = true; // every piece has let go: no wall left
        timers.push(window.setTimeout(finish, 1000));
      }
      if (gone && bodies.length === 0 && puffs.length === 0) finish();
    }
  };

  const render = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const k = shakeT > 0 ? Math.max(0, Math.min(1, shakeT / 0.22)) : 0;
    const sx = (Math.random() - 0.5) * 2 * shakeAmp * k, sy = (Math.random() - 0.5) * 2 * shakeAmp * k;
    // flying through: zoom in on the opening while it slides to the middle of the screen
    const zs = pass > 0 ? Math.pow(zoomTo, pass * pass) : 1;
    const slide = smooth(0, 0.7, pass);
    const ox = fx + (W / 2 - fx) * slide - fx * zs, oy = fy + (H / 2 - fy) * slide - fy * zs;
    const tf = (c: CanvasRenderingContext2D) => c.setTransform(dpr * zs, 0, 0, dpr * zs, (ox + sx) * dpr, (oy + sy) * dpr);
    tf(ctx);
    bodies.sort((a, b) => b.z - a.z); // furthest away first, so nearer chunks are painted on top

    if (!gone) {
      // the wall, with a plain strip around it so the shake never shows a gap at the edge of the screen
      if (k > 0) {
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(-20, -20, W + 40, H + 40);
      }
      ctx.drawImage(flatC, 0, 0, W, H);

      // cut the holes out (the page shows through), then paint the thickness of the wall inside each one
      const cut = (path: Path2D) => {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = ctx.strokeStyle = "#000";
        ctx.lineWidth = 1.2;
        ctx.fill(path);
        ctx.stroke(path);
        ctx.globalCompositeOperation = "source-over";
      };
      for (const h of holes) cut(h.path);
      // (where two holes overlap, an edge of one can sit inside the other: those bits are skipped)
      for (const h of holes) drawRim(ctx, h.patch.cells, h.patch.out, W / 2, H / 2, inset(h.k), (x, y) => holes.some((o) => o !== h && openAt(o, x, y)));
      if (collapse && collapse.path) {
        cut(collapse.path);
        drawRim(ctx, collapse.patch.cells, collapse.patch.out, W / 2, H / 2, inset(collapse.k));
      }

      // the bits falling away behind the wall: painted BEHIND what's already there, so they only show through the holes
      if (bodies.some((b) => b.far)) {
        farx.setTransform(1, 0, 0, 1, 0, 0);
        farx.clearRect(0, 0, farC.width, farC.height);
        tf(farx);
        for (const b of bodies) if (b.far) drawBody(farx, b, W / 2, H / 2);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(farC, 0, 0);
        ctx.restore();
      }

      // the shadows the bits flying towards you throw on the wall
      for (const b of bodies) {
        if (b.far || b.z >= 0) continue;
        const off = -b.z * 0.4, s = WALL_FOCAL / (WALL_FOCAL + b.z * 0.25);
        const a = 0.16 * Math.max(0, 1 + b.z / 420) * Math.min(1, b.life / 0.35);
        if (a <= 0.004) continue;
        const c = Math.cos(b.rz), sn = Math.sin(b.rz);
        ctx.fillStyle = `rgba(0,0,0,${Math.min(0.6, a * 3).toFixed(3)})`;
        ctx.beginPath();
        b.pts.forEach((q, i) => {
          const qx = b.x + off * 0.6 + (q.x * c - q.y * sn) * s, qy = b.y + off * 0.8 + (q.x * sn + q.y * c) * s;
          if (i) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy);
        });
        ctx.closePath();
        ctx.fill();
      }
    } else {
      for (const b of bodies) if (b.far) drawBody(ctx, b, W / 2, H / 2);
    }

    // the bits coming towards you (chips, and the big chunks when the wall crumbles)
    for (const b of bodies) if (!b.far) drawBody(ctx, b, W / 2, H / 2);

    for (const p of puffs) {
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.2);
      ctx.drawImage(dustC, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
  };

  setup();
  px = W / 2;
  py = H / 2;
  let raf = 0, last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    if (dirty || bodies.length > 0 || puffs.length > 0) {
      render();
      dirty = false;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerdown", onDown);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  return () => {
    cancelAnimationFrame(raf);
    timers.forEach((t) => window.clearTimeout(t));
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerdown", onDown);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
  };
}

function WallIntro({ onBreak, onDone }: { onBreak: () => void; onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const promptTextRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current, prompt = promptRef.current, promptText = promptTextRef.current;
    if (!root || !canvas || !prompt || !promptText) return;
    return startWall(root, canvas, prompt, promptText, onBreak, onDone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      className="wall-root"
      role="dialog"
      aria-label="Break the wall to enter the site"
      style={{ position: "fixed", inset: 0, zIndex: 10000, touchAction: "none", userSelect: "none", background: WALL_COLOR }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* the big message in the middle, in the same font as "who am i?" (it goes away on the first hit) */}
      <div
        ref={promptRef}
        style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "0 1.5rem", pointerEvents: "none", transition: "opacity .45s ease" }}
      >
        <p
          ref={promptTextRef}
          style={{
            margin: 0, textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 700, lineHeight: 1.02,
            letterSpacing: "-0.025em", fontSize: "clamp(3.5rem, 12vw, 10rem)", color: WALL_TEXT_COLOR,
          }}
        >
          {WALL_PROMPT}
        </p>
      </div>

    </div>
  );
}

/* ---------- The camera behind the wall ---------- */

const CAMERA_HEIGHT = "600vh";              // how much scrolling the whole camera part takes (more = slower)
const CAMERA_TURN = 0.2;                    // how much of that scrolling it takes to turn round and zoom in on the screen (0.2 = the first 20%). The rest swipes through the screen's pages
const CAMERA_START_SIZE = 0.62;             // how big the whole camera is at the start (1 = as big as fits)
const CAMERA_SCREEN_SIZE = 0.86;            // once zoomed in, how much of the window's width the camera's screen may fill (it also always fits the height)
const CAMERA_SWIPE = 50;                    // how far (px) you have to swipe or drag across the screen to go to the next page
const CAMERA_YAW = 0;                       // how far it's turned at the start, in degrees (0 = facing you straight on)
const CAMERA_TILT = 0;                      // how much you look down on it at the start, in degrees
const CAMERA_SPIN = 0.45;                   // at the start you can drag the camera round to look at it from any side: degrees it turns per pixel dragged
const CAMERA_MOUSE = 6;                     // how much it leans to follow the mouse at the start, in degrees (0 = not at all)
const CAMERA_LINE = BLUE;                   // r,g,b of the body and lens lines
const CAMERA_GLASS = "170,215,255";         // r,g,b of the glass inside the lens
const CAMERA_BLADES = "255,190,110";        // r,g,b of the aperture blades
const CAMERA_LIT = "255,255,255";           // r,g,b of the edge of the opening
const CAMERA_SNAP = 0.35;                   // when you stop scrolling between two pages, it glides to the nearest one in this many seconds (0 = off)
const CAMERA_DOTS = "100,159,255";         // r,g,b of the little dots on the camera's back screen (the blue)
const CAMERA_DOTS_LIT = "160,205,255";      // r,g,b of a dot once the pointer has passed over it (a lighter blue)
const CAMERA_DOT_GAP = 7;                   // how far apart the dots on the screen are (lower = more, finer dots; about 4.5 = 1mm)
const CAMERA_DOT_FAINT = 0.2;               // how visible the dots are before you hover over them (0 = hidden until lit)
const CAMERA_DOT_TURN = -0.3;               // how far round you have to turn the camera before the dots light up (-1 = even from the front, 0 = side on, 1 = only straight from the back)
const CAMERA_BRUSH = 0.05;                  // how big the patch that lights up under the pointer is, compared to the window (0.05 = 5% of its shorter side)
const CAMERA_SHARPNESS = 1.5;               // how sharp the camera is drawn on high-resolution screens (2 = fully sharp but slower, 1 = fastest)
const CAMERA_FILL = 0.035;                  // how see-through the surfaces are (0 = only lines, higher = more solid)
const CAMERA_FSTOP = 2.8;                   // the aperture you can see in the lens (1.8 = wide open, 8 = small)
const APERTURE_BLADES = 9;                  // how many blades the aperture has
// the pages on the camera's screen, in order (the words shown in the bar along its top)
const SCREEN_PAGES = ["who am i", "photos", "videos", "projects", "contact"];

// where the camera is and which way it faces. lit = how bright the edge of the opening is (0 to 1), body = how
// visible the body is, lens = how visible the lens around the blades is, iris = how bright the blades are,
// fstop = how far the aperture is closed, cx/cy = where it sits on the screen, scale = how big,
// yaw/tilt/roll = turned round / tipped forward / tipped on its side (radians),
// px/py/pz = the point on the model it turns around, depth = how strong the perspective is (higher = flatter)
// dots = the dots on the back screen: how lit each one is (0 = not yet .. 1 = fully), where each one landed on the page
// (filled in while drawing, for the pointer to find them) and how visible they all are (show)
type CameraPose = { dots: { lit: Float32Array; xy: Float32Array; show: number } | null; fstop: number; lit: number; body: number; lens: number; iris: number; yaw: number; tilt: number; roll: number; cx: number; cy: number; scale: number; px: number; py: number; pz: number; depth: number };

// The camera is a see-through 3D model made of lines, built from simple shapes: flat outlines given a thickness
// (body, hump, screen), outlines stacked at different heights (grip) and round shapes spun around a line (lens, dials). Then every point is turned, put in
// perspective and drawn on a flat canvas. Units are about 4.5 per millimetre. x = right, y = down,
// z = away from you when the lens points at you (the lens sticks out towards -z, the body sits from z 0 to 170).
type V3 = { x: number; y: number; z: number };
type Line3 = { pts: V3[]; closed: boolean; col: string; w: number }; // w = how bright (1 = normal)
type Model = { lines: Line3[]; faces: { pts: V3[]; col: string; w?: number }[] };

// turn an outline written like an SVG path ("M x y L x y Q ... C ... Z") into points.
// corner[i] = that point is the end of a piece (where the edges across the thickness get drawn)
const pathCache = new Map<string, { pts: Pt[]; corner: boolean[] }>();
function pathPts(d: string): { pts: Pt[]; corner: boolean[] } {
  const hit = pathCache.get(d);
  if (hit) return hit;
  const t = d.match(/[MLQCZ]|-?[\d.]+/g) || [];
  const pts: Pt[] = [], corner: boolean[] = [];
  let i = 0, cmd = "", x = 0, y = 0;
  const n = () => parseFloat(t[i++]);
  while (i < t.length) {
    if (/[MLQCZ]/.test(t[i])) cmd = t[i++];
    if (cmd === "Z") break;
    if (cmd === "M" || cmd === "L") {
      x = n(); y = n();
      pts.push({ x, y });
      corner.push(true);
    } else if (cmd === "Q") {
      const x1 = n(), y1 = n(), x2 = n(), y2 = n();
      for (let k = 1; k <= 8; k++) {
        const u = k / 8, v = 1 - u;
        pts.push({ x: v * v * x + 2 * v * u * x1 + u * u * x2, y: v * v * y + 2 * v * u * y1 + u * u * y2 });
        corner.push(k === 8);
      }
      x = x2; y = y2;
    } else if (cmd === "C") {
      const x1 = n(), y1 = n(), x2 = n(), y2 = n(), x3 = n(), y3 = n();
      for (let k = 1; k <= 12; k++) {
        const u = k / 12, v = 1 - u;
        pts.push({
          x: v * v * v * x + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3,
          y: v * v * v * y + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3,
        });
        corner.push(k === 12);
      }
      x = x3; y = y3;
    } else i++;
  }
  const out = { pts, corner };
  pathCache.set(d, out);
  return out;
}

// how a flat outline's (u, v) and its thickness (t) map onto the model:
const FRONT = (u: number, v: number, t: number): V3 => ({ x: u, y: v, z: t }); // drawn as seen from the front, thick front to back
const SIDE = (u: number, v: number, t: number): V3 => ({ x: t, y: v, z: u });  // drawn as seen from the side (u = front to back), thick left to right
const TOP = (u: number, v: number, t: number): V3 => ({ x: u, y: t, z: v });   // drawn as seen from above (v = front to back), thick top to bottom

// a flat outline with a thickness: one face at t0, the other at t1, and edges across at the corners
function prism(m: Model, d: string, t0: number, t1: number, col: string, at = FRONT, w = 1) {
  const { pts, corner } = pathPts(d);
  const f = pts.map((p) => at(p.x, p.y, t0)), b = pts.map((p) => at(p.x, p.y, t1));
  m.lines.push({ pts: f, closed: true, col, w }, { pts: b, closed: true, col, w });
  pts.forEach((_, i) => { if (corner[i]) m.lines.push({ pts: [f[i], b[i]], closed: false, col, w: 0.6 * w }); });
  m.faces.push({ pts: f, col, w }, { pts: b, col, w });
}
// the same kind of outline at several levels, each one a little different, joined up at the corners.
// For shapes whose sides curve, like the grip. rings = [the outline, how far along its thickness]; inner = how bright the rings in between are
function loft(m: Model, rings: [string, number][], col: string, at = FRONT, inner = 0.45) {
  let prev: V3[] = [];
  rings.forEach(([d, t], k) => {
    const { pts, corner } = pathPts(d);
    const cur = pts.map((q) => at(q.x, q.y, t));
    m.lines.push({ pts: cur, closed: false, col, w: k === 0 || k === rings.length - 1 ? 1 : inner });
    if (prev.length === cur.length) {
      const before = prev;
      cur.forEach((q, i) => { if (corner[i]) m.lines.push({ pts: [before[i], q], closed: false, col, w: 0.6 }); });
    }
    prev = cur;
  });
}
// just the outline (no thickness), for slots and panel edges
function outline(m: Model, d: string, t: number, col: string, at = FRONT, w = 0.5) {
  m.lines.push({ pts: pathPts(d).pts.map((p) => at(p.x, p.y, t)), closed: true, col, w });
}

// a point on a circle around one of the three directions: axis "z" = the lens's direction, "y" = up and down, "x" = left to right.
// (c1, c2) = the centre, t = how far along the axis
type Axis = "x" | "y" | "z";
function around(axis: Axis, c1: number, c2: number, t: number, r: number, a: number): V3 {
  const p = c1 + r * Math.cos(a), q = c2 + r * Math.sin(a);
  return axis === "z" ? { x: p, y: q, z: t } : axis === "y" ? { x: p, y: t, z: q } : { x: t, y: q, z: p };
}
function circle(m: Model, axis: Axis, c1: number, c2: number, t: number, r: number, col: string, w = 1) {
  m.lines.push({ pts: Array.from({ length: 56 }, (_, k) => around(axis, c1, c2, t, r, (k / 56) * Math.PI * 2)), closed: true, col, w });
}
// a round shape spun around an axis. prof = [how far along, radius, draw a ring here?].
// view = which way you're looking (so the two edges that make its outline can be found)
function spin(m: Model, prof: [number, number, boolean][], axis: Axis, c1: number, c2: number, col: string, view: V3, w = 1) {
  for (const [t, r, on] of prof) if (on && r > 0) circle(m, axis, c1, c2, t, r, col, w);
  // the view seen across the axis: looking straight down the axis there's no side to see, so the edges fade out
  const [a1, a2] = axis === "z" ? [view.x, view.y] : axis === "y" ? [view.x, view.z] : [view.z, view.y];
  const as = Math.atan2(-a1, a2);
  const sw = w * smooth(0.12, 0.45, Math.hypot(a1, a2));
  const side = (a: number) => prof.map(([t, r]) => around(axis, c1, c2, t, r, a));
  const s1 = side(as), s2 = side(as + Math.PI);
  m.lines.push({ pts: s1, closed: false, col, w: sw }, { pts: s2, closed: false, col, w: sw });
  m.faces.push({ pts: [...s1, ...s2.reverse()], col, w: sw });
}

// where the lens is: its middle (x, y), the depth of the aperture blades and how big their housing is
const LENS_X = 0, LENS_Y = 30, IRIS_Z = -270, IRIS_R = 140, LENS_FRONT = -486, LENS_R = 188;
// the screen on the back: the middle of its picture, its size (3 by 2, like the real one) and how far back it is
const SCREEN_X = 19, SCREEN_Y = 64.5, SCREEN_W = 338, SCREEN_H = 225, SCREEN_Z = 198;

// The grip, seen from above, for a grip that sticks out g in front of the body (it's open at the back, where it joins the body)
const gripPlan = (g: number) =>
  `M -150 0 Q -182 0 -190 ${-0.35 * g} L -200 ${-0.72 * g} Q -207 ${-g} -246 ${-g} L -300 ${-g} Q -346 ${-g} -350 ${-0.5 * g} L -350 0`;
// the grip at each height, top to bottom: [how far down, how far it sticks out]. The top slopes forward (where the
// shutter button sits), then there's a dip for your middle finger, then it fills out
const GRIP_RINGS: [string, number][] = ([[-128, 38], [-104, 90], [-62, 83], [30, 96], [150, 96], [185, 84]] as const).map(([y, g]) => [gripPlan(g), y]);

function buildCamera(view: V3, body: number, lens: number): Model {
  const m: Model = { lines: [], faces: [] };
  const G = CAMERA_LINE, GL = CAMERA_GLASS;

  // ---- the body (a small full-frame mirrorless camera, no logos). Seen from the front, the grip is on the left,
  // the lens sits a little right of the middle, and the viewfinder hump is above the lens. ----
  // the main box, drawn from above and given its height
  prism(m, "M -350 0 L 216 0 Q 246 0 246 30 L 246 155 Q 246 185 216 185 L -320 185 Q -350 185 -350 155 Z", -128, 185, G, TOP);
  // the grip, sticking out at the front on the left
  loft(m, GRIP_RINGS, G, TOP);
  // the viewfinder hump: it leans out a little over the lens mount, with the flash shoe on top
  prism(m, "M -90 -128 L -66 -184 Q -62 -192 -50 -192 L 62 -192 Q 74 -192 78 -184 L 102 -128 Z", -14, 185, G);
  prism(m, "M -46 46 L 58 46 L 58 182 L -46 182 Z", -192, -202, G, TOP, 0.7);
  outline(m, "M -30 62 L 42 62 L 42 182 L -30 182 Z", -202, G, TOP, 0.4);
  // the viewfinder eyecup on the back, and the window you look through
  prism(m, "M -66 -160 Q -66 -174 -52 -174 L 64 -174 Q 78 -174 78 -160 L 78 -76 Q 78 -62 64 -62 L -52 -62 Q -66 -62 -66 -76 Z", 185, 212, G);
  outline(m, "M -34 -150 L 46 -150 L 46 -92 L -34 -92 Z", 212, G);

  // on top, grip side: the shutter button on the slope of the grip, with the main dial just behind it
  spin(m, [[-116, 22, true], [-129, 22, true], [-132, 14, true]], "y", -282, -60, G, view, 0.8);
  spin(m, [[-14, 22, true], [16, 22, true]], "z", -298, -122, G, view, 0.8);
  circle(m, "y", -258, -24, -124, 7, G, 0.5);
  // the mode dial next to the hump, the record button, and the back dial with the power switch round it
  spin(m, [[-128, 40, true], [-150, 40, true], [-154, 33, true]], "y", -140, 95, G, view, 0.8);
  circle(m, "y", -222, 53, -129, 9, G, 0.5);
  spin(m, [[-128, 45, true], [-135, 45, true], [-135, 36, true], [-153, 36, true]], "y", -272, 124, G, view, 0.8);
  outline(m, "M -236 150 L -218 158 L -224 172 L -244 162 Z", -132, G, TOP, 0.5);
  // on top, the other side: the photo / video switch
  spin(m, [[-128, 30, true], [-144, 30, true], [-147, 24, true]], "y", 176, 120, G, view, 0.8);
  outline(m, "M 196 84 L 214 92 L 208 104 L 192 98 Z", -134, G, TOP, 0.5);

  // on the front: the ring the lens locks into, the lens release button beside it, and the little lamp by the grip
  spin(m, [[0, 160, true], [-12, 154, true]], "z", LENS_X, LENS_Y, G, view, 0.8);
  spin(m, [[0, 20, true], [-8, 20, true]], "z", 208, 8, G, view, 0.6);
  circle(m, "z", -150, -92, -1, 9, G, 0.5);

  // on the back: the flip-out screen...
  prism(m, "M -166 -62 L 204 -62 L 204 187 L -166 187 Z", 185, SCREEN_Z, G, FRONT, 0.8);
  const sx0 = SCREEN_X - SCREEN_W / 2, sx1 = SCREEN_X + SCREEN_W / 2, sy0 = SCREEN_Y - SCREEN_H / 2, sy1 = SCREEN_Y + SCREEN_H / 2;
  outline(m, `M ${sx0} ${sy0} L ${sx1} ${sy0} L ${sx1} ${sy1} L ${sx0} ${sy1} Z`, SCREEN_Z, G);
  outline(m, "M 212 -40 L 234 -40 L 234 165 L 212 165 Z", 186, G, FRONT, 0.35); // its hinge
  // ...and the buttons: menu, AF-ON and the two above the thumb, info, the round pad, play and delete
  for (const [bx, by, br] of [[178, -78, 13], [-265, -74, 16], [-316, -74, 10], [-320, -38, 10], [-205, 20, 14], [-239, 76, 36], [-239, 76, 14], [-205, 136, 11], [-269, 136, 11]] as const) {
    circle(m, "z", bx, by, 186, br, G, 0.5);
  }

  // underneath: the tripod thread and the battery door under the grip
  circle(m, "y", 0, 95, 185, 13, G, 0.5);
  circle(m, "y", 0, 95, 185, 26, G, 0.35);
  outline(m, "M -334 -58 Q -334 -74 -318 -74 L -214 -74 Q -198 -74 -198 -58 L -198 150 Q -198 166 -214 166 L -318 166 Q -334 166 -334 150 Z", 185, G, TOP, 0.4);
  // on the sides: the strap loops, and the covers over the sockets
  outline(m, "M 84 -116 L 108 -116 L 108 -92 L 84 -92 Z", 248, G, SIDE);
  outline(m, "M 84 -116 L 108 -116 L 108 -92 L 84 -92 Z", -352, G, SIDE);
  outline(m, "M 44 -52 Q 44 -64 56 -64 L 138 -64 Q 150 -64 150 -52 L 150 118 Q 150 130 138 130 L 56 130 Q 44 130 44 118 Z", 246, G, SIDE, 0.4);

  // everything so far fades away as you zoom in on the lens
  for (const l of m.lines) l.w *= body;
  for (const f of m.faces) f.w = (f.w ?? 1) * body;

  // ---- the lens (a 24-105mm f4 zoom, no writing on it) ----
  const lensLines = m.lines.length, lensFaces = m.faces.length;
  spin(m, [
    [0, 128, true], [-22, 128, true], [-30, 150, true], [-48, 182, true], [-150, 184, true],
    [-158, LENS_R, true], [-300, LENS_R, true], [-308, 184, true], [-325, 184, true], [-333, LENS_R, true],
    [-440, LENS_R, true], [-448, 184, true], [-480, 184, true], [LENS_FRONT, 176, true],
  ], "z", LENS_X, LENS_Y, G, view);
  // the rubber grip on the zoom ring and the focus ring
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2;
    for (const [z0, z1] of [[-164, -294], [-339, -398]]) {
      m.lines.push({ pts: [around("z", LENS_X, LENS_Y, z0, LENS_R + 1, a), around("z", LENS_X, LENS_Y, z1, LENS_R + 1, a)], closed: false, col: G, w: 0.18 });
    }
  }
  // the control ring at the front: a finer, criss-cross grip
  circle(m, "z", LENS_X, LENS_Y, -406, LENS_R, G, 0.5);
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2, tw = Math.PI / 64;
    for (const d of [tw, -tw]) {
      m.lines.push({ pts: [around("z", LENS_X, LENS_Y, -410, LENS_R + 1, a - d), around("z", LENS_X, LENS_Y, -436, LENS_R + 1, a + d)], closed: false, col: G, w: 0.16 });
    }
  }
  // the panel of switches on the side of the lens, near the body (it follows the curve of the barrel)
  const onBarrel = (a0: number, a1: number, z0: number, z1: number, w: number) => {
    const pts: V3[] = [];
    for (let k = 0; k <= 6; k++) pts.push(around("z", LENS_X, LENS_Y, z0, 185, a0 + ((a1 - a0) * k) / 6));
    for (let k = 6; k >= 0; k--) pts.push(around("z", LENS_X, LENS_Y, z1, 185, a0 + ((a1 - a0) * k) / 6));
    m.lines.push({ pts, closed: true, col: G, w });
  };
  onBarrel(-0.42, 0.42, -62, -142, 0.5);
  onBarrel(-0.3, -0.08, -84, -120, 0.4);
  onBarrel(0.08, 0.3, -84, -120, 0.4);
  // the glass: a domed front element, and more elements further in
  spin(m, [[-466, 156, true], [-475, 134, true], [-481, 100, true], [-484, 52, false]], "z", LENS_X, LENS_Y, GL, view, 0.8);
  circle(m, "z", LENS_X, LENS_Y, -472, 166, G, 0.6);
  for (const [z, r] of [[-400, 146], [-150, 120], [-60, 104]] as const) circle(m, "z", LENS_X, LENS_Y, z, r, GL, 0.3);
  // the lens fades away too, leaving only the blades
  for (let i = lensLines; i < m.lines.length; i++) m.lines[i].w *= lens;
  for (let i = lensFaces; i < m.faces.length; i++) m.faces[i].w = (m.faces[i].w ?? 1) * lens;
  // the ring that holds the aperture blades
  circle(m, "z", LENS_X, LENS_Y, IRIS_Z, IRIS_R, CAMERA_BLADES, 0.6);
  circle(m, "z", LENS_X, LENS_Y, IRIS_Z + 8, IRIS_R + 6, CAMERA_BLADES, 0.35);
  return m;
}

// One blade's edge, from corner b of the opening (coming from corner a) out to the housing of radius R.
// It sets off along the side of the opening and keeps turning outwards, so it sweeps round in a curve.
// BLADE_CURVE = how much it curves (0 = straight lines).
const BLADE_CURVE = 1.1;
function bladeEdge(a: { x: number; y: number }, b: { x: number; y: number }, R: number): { x: number; y: number }[] {
  let dx = b.x - a.x, dy = b.y - a.y;
  const dl = Math.hypot(dx, dy);
  if (dl < 1e-6) { // opening shut to a point: set off sideways from the middle
    const ang = Math.atan2(b.y, b.x) + Math.PI / 2;
    dx = Math.cos(ang); dy = Math.sin(ang);
  } else { dx /= dl; dy /= dl; }
  const turn = Math.sign(dx * b.y - dy * b.x) || 1; // which way is outwards
  const step = R / 60, k = (BLADE_CURVE / R) * step * turn;
  const pts = [{ x: b.x, y: b.y }];
  let x = b.x, y = b.y;
  for (let n = 0; n < 400; n++) {
    // turn a little towards pointing straight out, but never past it
    const out = Math.atan2(y, x), head = Math.atan2(dy, dx);
    let diff = out - head;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const rot = Math.abs(diff) < Math.abs(k) ? diff : k;
    const c = Math.cos(rot), s = Math.sin(rot);
    [dx, dy] = [dx * c - dy * s, dx * s + dy * c];
    const nx = x + dx * step, ny = y + dy * step;
    if (Math.hypot(nx, ny) >= R) { // reached the housing: end exactly on it
      const pb = x * dx + y * dy, t = -pb + Math.sqrt(Math.max(0, pb * pb - (x * x + y * y - R * R)));
      pts.push({ x: x + dx * t, y: y + dy * t });
      break;
    }
    x = nx; y = ny;
    pts.push({ x, y });
  }
  return pts;
}

// the dots on the camera's back screen: a grid over its picture (rows offset like brick), worked out once
const CAMERA_SCREEN_DOTS: V3[] = (() => {
  const out: V3[] = [], g = CAMERA_DOT_GAP;
  for (let v = g / 2, row = 0; v < SCREEN_H; v += g, row++) {
    for (let u = row % 2 ? g : g / 2; u < SCREEN_W; u += g) {
      out.push({ x: SCREEN_X - SCREEN_W / 2 + u, y: SCREEN_Y - SCREEN_H / 2 + v, z: SCREEN_Z });
    }
  }
  return out;
})();

// where the camera's back screen ended up on the page (its picture area)
type ScreenBox = { x: number; y: number; w: number; h: number };

// draw the model in a pose
function drawCamera(ctx: CanvasRenderingContext2D, o: CameraPose): ScreenBox {
  const cY = Math.cos(o.yaw), sY = Math.sin(o.yaw), cT = Math.cos(o.tilt), sT = Math.sin(o.tilt);
  const cR = Math.cos(o.roll), sR = Math.sin(o.roll);
  // which way you're looking, in the model's own directions
  const view = { x: -sY * cT, y: sT, z: cY * cT };
  const m = buildCamera(view, o.body, o.lens);

  const s = o.scale, F = o.depth;
  const proj = (p: V3) => {
    const X = p.x - o.px, Y = p.y - o.py, Z = p.z - o.pz;
    const x1 = X * cY + Z * sY, z1 = -X * sY + Z * cY;
    const y2 = Y * cT - z1 * sT, z2 = Y * sT + z1 * cT;
    const k = F / (F + z2);
    const a = x1 * s * k, b = y2 * s * k;
    return { x: o.cx + a * cR - b * sR, y: o.cy + a * sR + b * cR, z: z2 };
  };
  const trace = (path: CanvasRenderingContext2D | Path2D, pts: V3[], closed: boolean) => {
    pts.forEach((p, i) => { const q = proj(p); if (i) path.lineTo(q.x, q.y); else path.moveTo(q.x, q.y); });
    if (closed) path.closePath();
  };

  ctx.save();
  // everything adds light on top of what's under it, so overlapping see-through parts glow a little more
  ctx.globalCompositeOperation = "lighter";

  // the dots on the screen: faint ones, and the ones the pointer has lit up. Nearer ones are brighter, like the lines
  if (o.dots && o.dots.show > 0.003) {
    const D = CAMERA_SCREEN_DOTS, { lit, xy, show } = o.dots;
    const LV = 4, faint = Array.from({ length: LV }, () => new Path2D()), glow = Array.from({ length: LV }, () => new Path2D());
    for (let i = 0; i < D.length; i++) {
      const d = D[i], q = proj(d);
      xy[i * 2] = q.x;
      xy[i * 2 + 1] = q.y;
      const k = F / (F + q.z), size = Math.max(0.9, CAMERA_DOT_GAP * s * k * 0.26);
      const near = clamp(0.5 - q.z / 900, 0, 1), lv = Math.min(LV - 1, Math.floor(near * LV));
      const v = lit[i];
      if (v > 0) {
        const g = size * (1.2 + 0.6 * v);
        glow[Math.min(LV - 1, Math.floor(v * LV))].rect(q.x - g / 2, q.y - g / 2, g, g);
      } else faint[lv].rect(q.x - size / 2, q.y - size / 2, size, size);
    }
    faint.forEach((path, lv) => {
      ctx.fillStyle = `rgba(${CAMERA_DOTS},${(CAMERA_DOT_FAINT * show * (0.35 + 0.65 * (lv + 0.5) / LV)).toFixed(3)})`;
      ctx.fill(path);
    });
    glow.forEach((path, i) => {
      ctx.fillStyle = `rgba(${CAMERA_DOTS_LIT},${((0.35 + 0.65 * ((i + 1) / LV)) * show).toFixed(3)})`;
      ctx.fill(path);
    });
  }

  if (CAMERA_FILL > 0) {
    for (const f of m.faces) {
      const fw = f.w ?? 1;
      if (fw < 0.01) continue;
      ctx.fillStyle = `rgba(${f.col},${(CAMERA_FILL * fw).toFixed(4)})`;
      ctx.beginPath();
      trace(ctx, f.pts, true);
      ctx.fill();
    }
  }

  // lines are grouped by colour and by how near they are (nearer = brighter), then drawn in one go per group
  const LEVELS = 5;
  const groups = new Map<string, { col: string; a: number; path: Path2D }>();
  for (const l of m.lines) {
    if (l.w < 0.01) continue; // faded out
    const q = l.pts.map(proj);
    const n = l.closed ? q.length : q.length - 1;
    for (let i = 0; i < n; i++) {
      const a = q[i], b = q[(i + 1) % q.length];
      const near = Math.min(1, Math.max(0, 0.5 - (a.z + b.z) / 2 / 900));
      const lv = Math.min(LEVELS - 1, Math.floor(near * LEVELS));
      const key = `${l.col}|${lv}|${l.w}`;
      let g = groups.get(key);
      if (!g) {
        g = { col: l.col, a: (0.25 + 0.75 * (lv + 0.5) / LEVELS) * l.w, path: new Path2D() };
        groups.set(key, g);
      }
      g.path.moveTo(a.x, a.y);
      g.path.lineTo(b.x, b.y);
    }
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const glowLine = (path: Path2D, col: string, a: number, width = 1.1) => {
    ctx.strokeStyle = `rgba(${col},${(a * 0.12).toFixed(3)})`; // soft glow
    ctx.lineWidth = 4 * (width / 1.1);
    ctx.stroke(path);
    ctx.strokeStyle = `rgba(${col},${Math.min(1, a).toFixed(3)})`;
    ctx.lineWidth = width;
    ctx.stroke(path);
  };
  for (const g of groups.values()) glowLine(g.path, g.col, g.a);

  // ---- the aperture blades. The opening is smaller the higher the f-number, and the blades
  // turn a little as it closes, like a real lens. ----
  if (o.iris > 0.01) {
    const N = APERTURE_BLADES, R = IRIS_R;
    const r = R * 0.94 * (1.8 / Math.max(1.8, o.fstop)); // the opening's size: nearly the whole ring wide open (f/1.8), halving every two stops
    const rot = -0.25 + (1 - r / R) * 1.2;
    const at = (x: number, y: number) => ({ x: LENS_X + x, y: LENS_Y + y, z: IRIS_Z });
    const v = Array.from({ length: N }, (_, i) => {
      const a = rot + (i / N) * Math.PI * 2;
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });
    // the blades: everything between the housing and the opening, lightly filled
    const fill = new Path2D();
    trace(fill, Array.from({ length: 72 }, (_, k) => at(R * Math.cos((k / 72) * Math.PI * 2), R * Math.sin((k / 72) * Math.PI * 2))), true);
    trace(fill, v.map((p) => at(p.x, p.y)), true);
    ctx.fillStyle = `rgba(${CAMERA_BLADES},${(0.08 * o.iris).toFixed(3)})`;
    ctx.fill(fill, "evenodd");
    // each blade's edge carries on from the corner of the opening and sweeps round in a smooth curve
    // out to the housing, like the curved blades of a real lens
    const edges = new Path2D();
    for (let i = 0; i < N; i++) {
      trace(edges, bladeEdge(v[i], v[(i + 1) % N], R).map((p) => at(p.x, p.y)), false);
    }
    glowLine(edges, CAMERA_BLADES, 0.75 * o.iris, 1);
    // the edge of the opening
    const hole = new Path2D();
    trace(hole, v.map((p) => at(p.x, p.y)), true);
    glowLine(hole, mixRgb(CAMERA_BLADES, CAMERA_LIT, 0.4 + 0.6 * o.lit), (0.7 + 0.3 * o.lit) * o.iris, 1.3);
  }

  ctx.restore();
  // where the screen's corners landed
  const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => proj({ x: SCREEN_X + (a * SCREEN_W) / 2, y: SCREEN_Y + (b * SCREEN_H) / 2, z: SCREEN_Z }));
  const xs = q.map((p) => p.x), ys = q.map((p) => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// mix two "r,g,b" colours: t = 0 gives a, t = 1 gives b
function mixRgb(a: string, b: string, t: number): string {
  const x = a.split(",").map(Number), y = b.split(",").map(Number);
  return x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",");
}

/* ---------- Page ---------- */

export default function Home() {
  const lenisRef = useRef<Lenis | null>(null);
  const camRef = useRef<HTMLElement>(null);
  const camCanvasRef = useRef<HTMLCanvasElement>(null);
  const camHintRef = useRef<HTMLDivElement>(null);
  // the camera's screen: the box laid over it, the strip of pages that slides along, each page, the dots
  const screenRef = useRef<HTMLDivElement>(null);
  const screenTrackRef = useRef<HTMLDivElement>(null);
  const screenPageEls = useRef<(HTMLDivElement | null)[]>([]);
  const screenDotEls = useRef<(HTMLButtonElement | null)[]>([]);
  const goToPageRef = useRef<(i: number) => void>(() => {});
  // the visitor's real battery, for the bar along the top of the camera's screen: how full (0 to 1) and whether
  // it's charging. Only some browsers share this (Chrome, Edge, Opera, Chrome on Android); in the others
  // (Safari, every iPhone browser, Firefox) it stays null and the battery just shows full with no number.
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  useEffect(() => {
    type Battery = EventTarget & { level: number; charging: boolean };
    const nav = navigator as Navigator & { getBattery?: () => Promise<Battery> };
    if (!nav.getBattery) return;
    let b: Battery | null = null, gone = false;
    const update = () => { if (b && !gone) setBattery({ level: b.level, charging: b.charging }); };
    nav.getBattery().then((bat) => {
      if (gone) return;
      b = bat;
      update();
      bat.addEventListener("levelchange", update);
      bat.addEventListener("chargingchange", update);
    }).catch(() => {});
    return () => {
      gone = true;
      b?.removeEventListener("levelchange", update);
      b?.removeEventListener("chargingchange", update);
    };
  }, []);
  // your photo albums, for the photos page on the screen (read from public/photos by app/api/albums/route.ts)
  const [albums, setAlbums] = useState<{ id: string; title: string; description: string; cover: string; count: number }[]>([]);
  useEffect(() => {
    let gone = false;
    fetch("/api/albums").then((r) => (r.ok ? r.json() : [])).then((a) => { if (!gone) setAlbums(a); }).catch(() => {});
    return () => { gone = true; };
  }, []);
  // the albums to show: the ones named in HOME_ALBUMS first, then any others, three in all
  const featured = [
    ...HOME_ALBUMS.map((n) => albums.find((a) => a.id === n)).filter((a): a is (typeof albums)[number] => !!a),
    ...albums.filter((a) => !HOME_ALBUMS.includes(a.id)),
  ].slice(0, 3);

  // the concrete wall you break through when you first arrive (see WallIntro)
  const [phase, setPhase] = useState<"wall" | "breaking" | "none">(() =>
    typeof window === "undefined" || shouldPlayIntro() ? "wall" : "none",
  );
  const introOn = phase !== "none";


  // Lenis smooth scrolling (only on this page: it switches itself off when you leave)
  useEffect(() => {
    const lenis = new Lenis({ lerp: LENIS_LERP, wheelMultiplier: LENIS_WHEEL, smoothWheel: true });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenisRef.current = null;
      lenis.destroy();
    };
  }, []);

  // once this page has been shown, clicking around the site (like the "wingwang" logo) never brings the wall back
  useEffect(() => {
    introSeen = true;
  }, []);

  // while the wall is up there is no scrolling
  useEffect(() => {
    if (!introOn) return;
    window.scrollTo(0, 0);
    lenisRef.current?.stop();
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
      lenisRef.current?.start();
    };
  }, [introOn]);

  // The camera. At the start you can drag it round to look at it from any side (it also leans a little towards
  // the mouse and sways gently). As you scroll, it turns round to show its back and zooms in on the screen there
  // (on phones held upright it also tips on its side, so the screen stands up tall). Then the screen's pages
  // (who am i, photos, videos, projects, contact) slide past one at a time as you keep scrolling. You can also
  // swipe or drag them sideways, press the left and right arrow keys, or tap the dots.
  useEffect(() => {
    const box = camRef.current, cv = camCanvasRef.current, hint = camHintRef.current;
    const scr = screenRef.current, track = screenTrackRef.current;
    const c = cv?.getContext("2d");
    if (!box || !cv || !c || !scr || !track) return;
    const T = CAMERA_TURN, n = SCREEN_PAGES.length;
    let raf = 0, last = performance.now(), ps = 0, w = 0, h = 0, dpr = 1, tv = 0, page = -1, boxKey = "";
    // the last pose drawn, and where the screen was: if nothing has moved since, the drawing is left as it is
    let drawnKey = "", drawnBox: ScreenBox | null = null;
    // the dots over the camera: how lit each one is, where each one is on the page, a little wobble in the
    // brush's edge for each (so the lit patch looks hand painted), and a count that goes up whenever any change
    const D = CAMERA_SCREEN_DOTS;
    const dotLit = new Float32Array(D.length), dotXY = new Float32Array(D.length * 2).fill(-1e5);
    const dotJit = Float32Array.from(D, (_, i) => { const r = Math.sin(i * 127.1 + 311.7) * 43758.5453; return 0.7 + 0.5 * (r - Math.floor(r)); });
    // how much the screen on the back faces you (1 = straight at you, 0 = side on, below 0 = you're looking at the front),
    // from the last frame drawn. The dots only light up when you've turned the camera to see its side or back
    let screenFacing = -1, circled = false;
    let dotVer = 0, dotsAny = false, ptrX = -1e5, ptrY = -1e5, brushX = -1e5, brushY = -1e5;
    let mx = 0, my = 0, ex = 0, ey = 0;
    // turning the camera by hand: how far it's turned (ry = round, rx = up and down, in radians), how fast it's
    // still turning after you let go, and when the pointer last moved
    let spinning = false, lastX = 0, lastY = 0, ry = 0, rx = 0, vy = 0, vx = 0, movedAt = 0;
    const START = 0.01; // you can turn it until you've scrolled this far (1 = the whole camera part)
    // swiping the screen: where the swipe started, whether it's gone sideways yet, and how far the pages are pulled along
    let swipe: { id: number; x: number; y: number; on: boolean } | null = null, dragPx = 0, justSwiped = false;
    // a page you asked for (by swiping, the dots or the arrow keys) that the scrolling is on its way to (-1 = none)
    let forced = -1;
    let lastScroll = performance.now(), snapping = false, snapAt = 0; // when the page last moved, and whether it is gliding to a stop
    const onScroll = () => { if (!snapping) lastScroll = performance.now(); };
    const size = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(CAMERA_SHARPNESS, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      drawnKey = ""; // resizing clears the canvas, so draw again
    };
    // how far down the page to scroll to for screen page i (or part way into it)
    const scrollFor = (i: number) => {
      const br = box.getBoundingClientRect();
      return window.scrollY + br.top + (T + (i / n) * (1 - T)) * (br.height - h);
    };
    const glide = (y: number, secs: number) => {
      const l = lenisRef.current;
      snapping = true;
      snapAt = performance.now();
      const done = () => { snapping = false; forced = -1; lastScroll = performance.now(); };
      if (l) l.scrollTo(y, { duration: secs, onComplete: done });
      else { window.scrollTo(0, y); done(); }
    };
    const goTo = (i: number) => {
      const j = clamp(i, 0, n - 1);
      forced = j;
      glide(scrollFor(j + 0.3), 0.7);
    };
    goToPageRef.current = goTo;

    const onMove = (e: PointerEvent) => {
      ptrX = e.clientX;
      ptrY = e.clientY;
      if (spinning) {
        // the side of the camera nearest you follows the pointer. Up and down stops at straight above / straight below
        const k = (CAMERA_SPIN * Math.PI) / 180, now = performance.now(), gap = Math.max(0.008, (now - movedAt) / 1000);
        const dy = -(e.clientX - lastX) * k, dx = (e.clientY - lastY) * k;
        ry += dy;
        rx = clamp(rx + dx, -Math.PI / 2, Math.PI / 2);
        vy = dy / gap;
        vx = dx / gap;
        movedAt = now;
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || ps >= START) return;
      // at the start: dragging turns the camera (on phones: swipe sideways; up and down still scrolls)
      spinning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      vy = vx = 0;
      movedAt = performance.now();
      if (e.pointerType === "mouse") e.preventDefault();
    };
    const onUp = () => {
      if (spinning && performance.now() - movedAt > 90) vy = vx = 0; // held still before letting go: it stays put
      spinning = false;
    };

    // swiping the screen's pages, like on a phone
    const onScrDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      justSwiped = false;
      swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, on: false };
      if (e.pointerType === "mouse") e.preventDefault(); // no selecting text or dragging pictures out
    };
    const onScrMove = (e: PointerEvent) => {
      if (!swipe || e.pointerId !== swipe.id) return;
      const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
      if (!swipe.on) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { swipe = null; return; } // going up or down: that's scrolling
        if (Math.abs(dx) < 8) return;
        swipe.on = true;
        scr.setPointerCapture(e.pointerId);
      }
      const at = Math.round(tv);
      // past the first or last page it only gives a little, then springs back
      dragPx = (at === 0 && dx > 0) || (at === n - 1 && dx < 0) ? dx * 0.3 : dx;
    };
    const onScrUp = (e: PointerEvent) => {
      if (!swipe || e.pointerId !== swipe.id) return;
      if (swipe.on) {
        const dx = e.clientX - swipe.x, at = Math.round(tv);
        justSwiped = true; // so letting go over a button doesn't also press it
        // carry on from exactly where the pages were pulled to
        tv -= dragPx / Math.max(1, scr.clientWidth);
        dragPx = 0;
        if (dx < -CAMERA_SWIPE && at < n - 1) goTo(at + 1);
        else if (dx > CAMERA_SWIPE && at > 0) goTo(at - 1);
      }
      swipe = null;
    };
    const onScrClick = (e: MouseEvent) => {
      if (!justSwiped) return;
      justSwiped = false;
      e.preventDefault();
      e.stopPropagation();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (scr.style.visibility !== "visible" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      goTo(Math.round(tv) + (e.key === "ArrowRight" ? 1 : -1));
    };

    size();
    window.addEventListener("resize", size);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    cv.addEventListener("pointerdown", onDown);
    scr.addEventListener("pointerdown", onScrDown);
    scr.addEventListener("pointermove", onScrMove);
    scr.addEventListener("pointerup", onScrUp);
    scr.addEventListener("pointercancel", onScrUp);
    scr.addEventListener("click", onScrClick, true);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const deg = Math.PI / 180;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const br = box.getBoundingClientRect();
      const p = clamp(-br.top / Math.max(1, br.height - h), 0, 1);
      ps += (p - ps) * (1 - Math.exp(-dt * 16)); // smooth out the scrolling a touch (the smooth scrolling already does most of it)
      ex += (mx - ex) * (1 - Math.exp(-dt * 3));
      ey += (my - ey) * (1 - Math.exp(-dt * 3));
      const f = smooth(0, T, ps); // 0 = the whole camera from the front, 1 = zoomed in on its screen

      // Turning it by hand: after you let go it carries on a little and slows down. Once you scroll, it stays where
      // you left it, and the turn towards the screen starts from there (scroll back up and it's where you left it).
      if (ps >= START) {
        spinning = false;
        vy = vx = 0;
      } else if (!spinning) {
        ry += vy * dt;
        rx = clamp(rx + vx * dt, -Math.PI / 2, Math.PI / 2);
        vy *= Math.exp(-dt * 3.5);
        vx *= Math.exp(-dt * 3.5);
      }
      ry = Math.atan2(Math.sin(ry), Math.cos(ry)); // keep it within one turn either way
      // where the turn starts (how you left it) and ends (its back facing you), going whichever way round is shorter
      const yaw0 = CAMERA_YAW * deg + ry, tilt0 = CAMERA_TILT * deg + rx;
      const toBack = Math.PI - yaw0, yaw1 = yaw0 + Math.atan2(Math.sin(toBack), Math.cos(toBack));

      // Lighting up the dots: every dot near the line the pointer moved along since the last frame lights up
      // (so fast moves don't skip any). Once you scroll on towards the screen, they all fade away.
      const dotShow = 1 - smooth(0.12, 0.55, f);
      const cr = cv.getBoundingClientRect();
      const bx = ptrX - cr.left, by = ptrY - cr.top;
      if (dotShow > 0.6 && screenFacing > CAMERA_DOT_TURN && (bx !== brushX || by !== brushY)) {
        const r = Math.min(w, h) * CAMERA_BRUSH;
        const fromX = brushX < -1e4 ? bx : brushX, fromY = brushY < -1e4 ? by : brushY;
        const sx = bx - fromX, sy = by - fromY, sl = sx * sx + sy * sy;
        const minX = Math.min(fromX, bx) - r * 1.2, maxX = Math.max(fromX, bx) + r * 1.2, minY = Math.min(fromY, by) - r * 1.2, maxY = Math.max(fromY, by) + r * 1.2;
        for (let i = 0; i < D.length; i++) {
          if (dotLit[i] !== 0) continue;
          const x = dotXY[i * 2], y = dotXY[i * 2 + 1];
          if (x < minX || x > maxX || y < minY || y > maxY) continue;
          const u = sl > 0 ? clamp(((x - fromX) * sx + (y - fromY) * sy) / sl, 0, 1) : 0;
          const dx = x - (fromX + sx * u), dy = y - (fromY + sy * u);
          if (dx * dx + dy * dy < (r * dotJit[i]) ** 2) { dotLit[i] = 0.01; dotsAny = true; dotVer++; }
        }
      }
      brushX = bx;
      brushY = by;
      if (dotsAny) {
        if (dotShow <= 0) { dotLit.fill(0); dotsAny = false; dotVer++; } // faded right out: start fresh next time
        else {
          // lit dots brighten quickly, one after another, as the brush passes
          let moving = false;
          for (let i = 0; i < dotLit.length; i++) if (dotLit[i] > 0 && dotLit[i] < 1) { dotLit[i] = Math.min(1, dotLit[i] + dt * 6); moving = true; }
          if (moving) dotVer++;
        }
      }

      // which page of the screen is showing: the scrolling after the turn is split into one share per page
      const u = clamp((ps - T) / (1 - T), 0, 1) * n;
      const k = Math.min(n - 1, Math.floor(u));
      const target = forced >= 0 ? forced : Math.min(n - 1, k + smooth(0.6, 1, u - k));
      tv += (target - tv) * (1 - Math.exp(-dt * 7)); // slides along and settles softly on each page
      if (!swipe?.on) dragPx *= Math.exp(-dt * 14); // a short swipe springs back

      // Snapping: if the scrolling stops part way between two pages, glide on to whichever is closer
      const l = lenisRef.current;
      if (snapping && now - snapAt > 1500) { snapping = false; forced = -1; } // in case a new scroll cut the glide short
      if (CAMERA_SNAP > 0 && l && !snapping && !spinning && !swipe && !l.isTouching && !l.isScrolling && now - lastScroll > 200) {
        const pu = clamp((p - T) / (1 - T), 0, 1) * n, pk = Math.floor(pu), pf = pu - pk;
        if (p > T && p < 1 && pk < n - 1 && pf > 0.6) glide(scrollFor(pf < 0.8 ? pk + 0.5 : pk + 1.05), CAMERA_SNAP);
      }

      // the screen's box: hidden until the camera has turned round and zoomed in
      const on = smooth(0.9, 1, f);
      let sb: ScreenBox | null = null;
      if (br.bottom > 0 && br.top < window.innerHeight) {
        const tall = h > w * 1.05; // a phone held upright: the camera tips on its side so its screen stands up tall
        // at the start: the whole camera, facing you, in the middle of the screen
        const sStart = tall ? Math.min((w * 0.62) / 760, (h * 0.5) / 720) : Math.min((w * 0.8) / 1000, (h * 0.75) / 720) * CAMERA_START_SIZE;
        // at the end: the back screen as big as fits (under the navbar)
        const sEnd = tall
          ? Math.min((w * 0.9) / SCREEN_H, (h * 0.76) / SCREEN_W)
          : Math.min((w * CAMERA_SCREEN_SIZE) / SCREEN_W, (h * 0.74) / SCREEN_H);
        const turn = smooth(0, 0.75, f); // it turns round first...
        const z = smooth(tall ? 0.4 : 0.15, 1, f); // ...while pushing in on the screen (later on phones, so it doesn't spill off the sides while it's side on)
        const t = now / 1000;
        const wob = 1 - f; // it stops leaning and swaying as it turns, so the screen ends up perfectly still
        const fade = smooth(0.3, 0.85, f); // the lens and blades fade back, so they don't show through the screen
        const pose: CameraPose = {
          dots: { lit: dotLit, xy: dotXY, show: dotShow },
          fstop: CAMERA_FSTOP,
          lit: 0,
          body: 1,
          lens: 1 - 0.85 * fade,
          iris: 0.4 * (1 - fade),
          yaw: lerp(yaw0, yaw1, turn) + (ex * CAMERA_MOUSE + Math.sin(t * 0.6) * 1.5) * wob * deg,
          tilt: lerp(tilt0, 0, turn) + (ey * CAMERA_MOUSE * 0.5 + Math.sin(t * 0.45)) * wob * deg,
          roll: tall ? (Math.PI / 2) * smooth(0.35, 1, f) : 0,
          cx: w / 2,
          cy: h / 2 + (tall ? 0 : 16 * z),
          scale: sStart * Math.pow(sEnd / sStart, z),
          px: lerp(0, SCREEN_X, z),
          py: lerp(0, SCREEN_Y, z),
          pz: lerp(-150, SCREEN_Z, z),
          depth: lerp(4000, 2400, f),
        };
        screenFacing = -Math.cos(pose.yaw) * Math.cos(pose.tilt);
        // only draw when something has visibly moved (once zoomed in on the screen, the camera holds still)
        // (angles to a twentieth of a degree: the slow sway at the start then redraws only when it has moved enough to see)
        const key = [pose.yaw, pose.tilt, pose.roll].map((v) => v.toFixed(3)).join(",") + "|" +
          [pose.lens, pose.iris, pose.scale, pose.px, pose.py, pose.pz, pose.depth].map((v) => v.toFixed(4)).join(",") +
          `|${pose.cx.toFixed(1)},${pose.cy.toFixed(1)},${w},${h}|${dotShow.toFixed(3)},${dotVer}`;
        if (key !== drawnKey || !drawnBox) {
          drawnKey = key;
          c.setTransform(dpr, 0, 0, dpr, 0, 0);
          c.clearRect(0, 0, w, h);
          drawnBox = drawCamera(c, pose);
        }
        sb = drawnBox;
      }
      if (sb && on > 0.001) {
        const key = `${Math.round(sb.x)},${Math.round(sb.y)},${Math.round(sb.w)},${Math.round(sb.h)}`;
        if (key !== boxKey) {
          boxKey = key;
          scr.style.left = `${Math.round(sb.x)}px`;
          scr.style.top = `${Math.round(sb.y)}px`;
          scr.style.width = `${Math.round(sb.w)}px`;
          scr.style.height = `${Math.round(sb.h)}px`;
        }
        scr.style.opacity = String(on);
        scr.style.visibility = "visible";
        scr.style.pointerEvents = on > 0.95 ? "auto" : "none";
      } else if (scr.style.visibility !== "hidden") {
        scr.style.visibility = "hidden";
        scr.style.pointerEvents = "none";
      }
      // slide the pages along
      const slide = `translate3d(calc(${(-tv * 100).toFixed(2)}% + ${dragPx.toFixed(1)}px),0,0)`;
      if (track.style.transform !== slide) track.style.transform = slide;
      const showing = clamp(Math.round(tv), 0, n - 1);
      if (showing !== page) {
        page = showing;
        // only the page that's showing can be clicked or reached with Tab
        screenPageEls.current.forEach((el, i) => {
          if (!el) return;
          el.inert = i !== page;
          el.setAttribute("aria-hidden", String(i !== page));
        });
        screenDotEls.current.forEach((el, i) => {
          if (!el) return;
          el.setAttribute("aria-current", String(i === page));
          el.style.background = i === page ? `rgb(${BLUE})` : "rgba(255,255,255,.25)";
          el.style.width = i === page ? "18px" : "6px";
        });
      }
      // the marker circle on "who am i": drawn while that page is up on the screen, rubbed out when it isn't
      const circleOn = on > 0.95 && page === 0 && Math.abs(tv) < 0.3;
      if (circleOn !== circled) {
        circled = circleOn;
        scr.querySelectorAll(".marker").forEach((el) => el.classList.toggle("drawn", circleOn));
      }
      if (hint) hint.style.opacity = String(1 - smooth(0, 0.03, ps));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      cv.removeEventListener("pointerdown", onDown);
      scr.removeEventListener("pointerdown", onScrDown);
      scr.removeEventListener("pointermove", onScrMove);
      scr.removeEventListener("pointerup", onScrUp);
      scr.removeEventListener("pointercancel", onScrUp);
      scr.removeEventListener("click", onScrClick, true);
    };
  }, []);

  // sizes for the writing on the camera's screen: they grow with the screen (cqmin = 1% of its shorter side)
  const scrTitle: CSSProperties = { fontSize: "clamp(1.35rem, 7cqmin, 3.75rem)" };
  const scrText: CSSProperties = { fontSize: "clamp(0.8rem, 2.5cqmin, 1.3rem)" };
  const scrSmall: CSSProperties = { fontSize: "clamp(0.7rem, 1.9cqmin, 1rem)" };
  const scrPad: CSSProperties = { padding: "clamp(14px, 5cqmin, 48px)", paddingTop: "clamp(10px, 3cqmin, 28px)" };

  return (
    <main className="relative text-white" style={{ background: `rgb(${PAGE_BLACK})` }}>

      {/* the page's main heading: screen readers and Google read it, it isn't shown */}
      <h1 className="sr-only">Ethan Wang: photography, and a bit about me</h1>

      {/* the wall (only when you first arrive) */}
      {introOn && <WallIntro onBreak={() => setPhase("breaking")} onDone={() => setPhase("none")} />}

      {/* dot + trailing ring cursor (it shows on the wall too) */}
      <Cursor />

      <style>{INTRO_CSS + LENIS_CSS + CURSOR_CSS + MARKER_CSS + CONTACT_CSS + BG_CSS + WALL_CSS}</style>

      {/* The camera behind the wall. Scrolling through this tall block turns it round and zooms in on its back
          screen. Then the screen's pages slide past: who am i, photos, videos, projects and contact
          (edit ABOUT_TITLE, ABOUT_TEXT, ABOUT_PRO, ABOUT_PERSONAL, HOME_ALBUMS, HOME_VIDEO, HOME_PROJECTS and CONTACT_TEXT at the top). */}
      <section ref={camRef} className="relative -mt-16" style={{ height: CAMERA_HEIGHT }}>
        <div className="sticky top-0 z-10 h-dvh w-full overflow-hidden">
          <canvas ref={camCanvasRef} role="img" aria-label="A see-through 3D camera. Drag to turn it." className="absolute inset-0 h-full w-full" style={{ touchAction: "pan-y" }} />

          {/* the camera's back screen: laid exactly over the screen in the drawing once it's zoomed in */}
          <div
            ref={screenRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="the camera's screen"
            className="absolute flex select-none flex-col overflow-hidden rounded-[2px]"
            style={{
              left: 0, top: 0, width: 0, height: 0, opacity: 0, visibility: "hidden",
              containerType: "size", touchAction: "pan-y",
              background: "#000",
              boxShadow: `0 0 0 1px rgba(${BLUE},.6), 0 0 28px rgba(${BLUE},.22)`,
            }}
          >
            {/* the bar along the top, like a camera's screen: the settings and the battery */}
            <div className="flex shrink-0 items-center justify-end font-mono text-neutral-400" style={{ ...scrSmall, padding: "clamp(8px, 2.4cqmin, 20px) clamp(14px, 5cqmin, 48px) 0" }}>
              <span className="flex items-center gap-[1.4em]">
                <span className="hidden sm:inline">f/{CAMERA_FSTOP}</span>
                <span className="hidden sm:inline">1/250</span>
                <span>ISO 100</span>
                {/* the visitor's battery: the percentage (if their browser shares it), and the icon filled to match.
                    It turns red at 20% or less, and shows a lightning bolt while charging */}
                <span className="flex items-center gap-[0.5em]" aria-label={battery ? `battery ${Math.round(battery.level * 100)}%${battery.charging ? ", charging" : ""}` : undefined}>
                  {battery && <span aria-hidden="true">{Math.round(battery.level * 100)}%</span>}
                  <svg viewBox="0 0 26 12" className="h-[1em] w-auto" aria-hidden="true">
                    <rect x="0.5" y="0.5" width="22" height="11" rx="2" fill="none" stroke="currentColor" />
                    <rect x="23" y="3.5" width="2.5" height="5" rx="1" fill="currentColor" />
                    <rect
                      x="2.5" y="2.5" height="7" rx="1"
                      width={(18 * clamp(battery ? battery.level : 1, 0.06, 1)).toFixed(2)}
                      fill={battery && battery.level <= 0.2 && !battery.charging ? "rgb(255,95,95)" : `rgb(${BLUE})`}
                    />
                    {battery?.charging && <path d="M12.5 1.8 8.6 6.6h3l-1.2 3.6 4-4.9h-3z" fill="#fff" />}
                  </svg>
                </span>
              </span>
            </div>

            {/* the pages, side by side; the strip slides along to show one at a time */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div ref={screenTrackRef} className="flex h-full will-change-transform">
                {/* 1: who am i */}
                <div ref={(el) => { screenPageEls.current[0] = el; }} role="group" aria-roledescription="slide" aria-label={`1 of ${SCREEN_PAGES.length}: who am i`} className="flex h-full w-full shrink-0 flex-col overflow-hidden" style={scrPad}>
                  <h2 className="font-bold leading-[1.02] tracking-tight" style={scrTitle}>{ABOUT_TITLE}</h2>
                  <div className="mt-[0.6em] space-y-[0.3em] leading-snug text-neutral-300" style={scrText}>
                    {ABOUT_TEXT.map((paragraph, i) => {
                      // circle ABOUT_CIRCLE (the first time it comes up) in blue, like with a marker
                      const at = ABOUT_CIRCLE ? paragraph.indexOf(ABOUT_CIRCLE) : -1;
                      if (at < 0) return <p key={i}>{paragraph}</p>;
                      return (
                        <p key={i}>
                          {paragraph.slice(0, at)}
                          <span className="marker">
                            {ABOUT_CIRCLE}
                            {/* a loop drawn in one stroke that runs a little past where it started, like a real marker */}
                            <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                              <path
                                d="M 22 7 C 48 -1, 90 1, 96 17 C 101 31, 66 39, 42 37.5 C 16 36, 1 28, 5 16 C 8 7, 28 2.5, 58 4.5"
                                pathLength={1}
                                fill="none"
                                stroke={`rgb(${BLUE})`}
                                strokeWidth={2.4}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                              />
                            </svg>
                          </span>
                          {paragraph.slice(at + ABOUT_CIRCLE.length)}
                        </p>
                      );
                    })}
                  </div>
                  {/* two columns (the professional side, then the personal side), spread out to fill the page */}
                  <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-[2em] py-[1.4em]" style={{ fontSize: "clamp(0.75rem, 2.5cqmin, 1.3rem)" }}>
                    {[ABOUT_PRO, ABOUT_PERSONAL].map((rows, c) => (
                      <dl key={c} className="flex min-w-0 flex-col justify-between gap-[0.8em]">
                        {rows.map((row, i) => (
                          <div key={i}>
                            <dt className="font-semibold text-white">{row.title}</dt>
                            <dd className="mt-[0.15em] leading-snug text-neutral-400">{row.text}</dd>
                          </div>
                        ))}
                      </dl>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/resume" className="contact-btn" draggable={false}>Résumé<ArrowUpRight /></Link>
                  </div>
                </div>

                {/* 2: photos */}
                <div ref={(el) => { screenPageEls.current[1] = el; }} role="group" aria-roledescription="slide" aria-label={`2 of ${SCREEN_PAGES.length}: photos`} className="flex h-full w-full shrink-0 flex-col overflow-hidden" style={scrPad}>
                  <h2 className="font-bold leading-[1.02] tracking-tight" style={scrTitle}>photos</h2>
                  <p className="mt-[0.5em] text-neutral-400" style={scrText}>
                    {albums.length > 0 ? `${albums.length} albums so far. the latest three:` : "albums from my camera roll."}
                  </p>
                  <div className="mt-[1em] grid min-h-0 flex-1 grid-cols-3 gap-[clamp(8px,2cqmin,20px)]">
                    {featured.map((a) => (
                      <Link key={a.id} href={`/photos/${encodeURIComponent(a.id)}`} draggable={false} className="group relative block min-h-0 overflow-hidden rounded-[3px] bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                        {a.cover && (
                          <Image src={a.cover} alt={`${a.title}: album cover`} fill sizes="(min-width: 768px) 28vw, 30vw" draggable={false} className="object-cover transition duration-700 group-hover:scale-[1.04]" />
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-[0.7em] pb-[0.5em] pt-[2em] font-semibold" style={scrSmall}>{a.id}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 pt-[1em]">
                    <Link href="/photos" className="contact-btn" draggable={false}>See all photos<ArrowUpRight /></Link>
                  </div>
                </div>

                {/* 3: videos */}
                <div ref={(el) => { screenPageEls.current[2] = el; }} role="group" aria-roledescription="slide" aria-label={`3 of ${SCREEN_PAGES.length}: videos`} className="flex h-full w-full shrink-0 flex-col overflow-hidden" style={scrPad}>
                  <h2 className="font-bold leading-[1.02] tracking-tight" style={scrTitle}>videos</h2>
                  <p className="mt-[0.5em] text-neutral-400" style={scrText}>{HOME_VIDEO.caption}</p>
                  <div className="relative mt-[1em] min-h-0 flex-1 overflow-hidden rounded-[3px] bg-neutral-900">
                    {HOME_VIDEO.src ? (
                      <video className="h-full w-full object-cover" src={HOME_VIDEO.src} poster={HOME_VIDEO.poster || undefined} controls playsInline preload="metadata" />
                    ) : (
                      <>
                        {/* the play button, until there's a video */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-[clamp(40px,12cqmin,80px)] w-[clamp(40px,12cqmin,80px)] items-center justify-center rounded-full border border-white/25 bg-white/5">
                            <svg viewBox="0 0 24 24" className="ml-[8%] h-[40%] w-[40%] text-white/70" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
                          </span>
                        </div>
                        <p className="absolute bottom-[0.8em] left-[1em] font-semibold" style={scrText}>{HOME_VIDEO.title}</p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 pt-[1em]">
                    <Link href="/videos" className="contact-btn" draggable={false}>See videos<ArrowUpRight /></Link>
                  </div>
                </div>

                {/* 4: projects */}
                <div ref={(el) => { screenPageEls.current[3] = el; }} role="group" aria-roledescription="slide" aria-label={`4 of ${SCREEN_PAGES.length}: projects`} className="flex h-full w-full shrink-0 flex-col overflow-hidden" style={scrPad}>
                  <h2 className="font-bold leading-[1.02] tracking-tight" style={scrTitle}>projects</h2>
                  {HOME_PROJECTS.length === 0 ? (
                    <p className="mt-[0.5em] text-neutral-400" style={scrText}>coming soon</p>
                  ) : (
                    <ul className="mt-[1em] min-h-0 flex-1 divide-y divide-white/10 overflow-hidden border-y border-white/10" style={scrText}>
                      {HOME_PROJECTS.map((pj, i) => (
                        <li key={i}>
                          <Link href={pj.href} draggable={false} className="group flex items-baseline gap-[1em] py-[0.7em]">
                            <span className="w-[5em] shrink-0 text-neutral-500" style={scrSmall}>{pj.date}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold">{pj.title}</span>
                              <span className="mt-[0.1em] block text-neutral-400">{pj.text}</span>
                            </span>
                            <span className="text-neutral-500 transition group-hover:translate-x-1 group-hover:text-white" aria-hidden="true">&rarr;</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto flex flex-wrap gap-3 pt-[1em]">
                    <Link href="/projects" className="contact-btn" draggable={false}>See projects<ArrowUpRight /></Link>
                  </div>
                </div>

                {/* 5: contact */}
                <div ref={(el) => { screenPageEls.current[4] = el; }} role="group" aria-roledescription="slide" aria-label={`5 of ${SCREEN_PAGES.length}: contact`} className="flex h-full w-full shrink-0 flex-col overflow-hidden" style={scrPad}>
                  {/* on computers: the title, words and button on the left, the details down the right.
                      On phones it's all one column, with the button at the bottom */}
                  <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_1fr_auto] md:grid-cols-[2fr_3fr] md:grid-rows-[1fr_auto] md:gap-x-[3em]">
                    <div className="md:col-start-1 md:row-start-1">
                      <h2 className="font-bold leading-[1.02] tracking-tight" style={scrTitle}>{CONTACT_TITLE}</h2>
                      <p className="mt-[0.6em] leading-snug text-neutral-300" style={{ fontSize: "clamp(0.9rem, 3.2cqmin, 1.75rem)" }}>{CONTACT_TEXT}</p>
                    </div>
                    <dl className="my-[1.2em] flex min-h-0 flex-col justify-between divide-y divide-white/10 border-y border-white/10 md:col-start-2 md:row-span-2 md:row-start-1 md:my-0" style={{ fontSize: "clamp(0.75rem, 2.5cqmin, 1.3rem)" }}>
                      {CONTACT_MORE.map((row, i) => (
                        <div key={i} className="grid flex-1 grid-cols-[7.5em_1fr] items-center gap-x-[1em] py-[0.5em]">
                          <dt className="font-semibold text-white">{row.title}</dt>
                          <dd className="leading-snug text-neutral-400">{row.text}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="flex flex-wrap items-end gap-3 md:col-start-1 md:row-start-2">
                      <Link href="/contact" className="contact-btn" draggable={false}>Contact me<ArrowUpRight /></Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* the dots: which page you're on; tap one to go there */}
            <div className="flex shrink-0 items-center justify-center gap-2" style={{ padding: "0 0 clamp(8px, 2.4cqmin, 20px)" }}>
              {SCREEN_PAGES.map((name, i) => (
                <button
                  key={name}
                  ref={(el) => { screenDotEls.current[i] = el; }}
                  type="button"
                  aria-label={`show ${name}`}
                  onClick={() => goToPageRef.current(i)}
                  className="relative h-1.5 rounded-full transition-all duration-300 before:absolute before:-inset-3 before:content-['']"
                  style={{ width: 6, background: "rgba(255,255,255,.25)" }}
                />
              ))}
            </div>
          </div>

          <div ref={camHintRef} className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 whitespace-nowrap flex-col items-center gap-3 text-xs uppercase tracking-[0.3em] text-neutral-400">
            drag to turn / scroll
            <span className="sc-hint block h-10 w-px bg-white/60" />
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 px-6 pb-6 pt-2 text-xs text-neutral-500">
        {/* your resume page (app/resume/page.tsx) */}
        <Link href="/resume" className="contact-btn">
          Résumé
          <ArrowUpRight />
        </Link>
        <Link href="/contact" className="contact-btn">
          Contact me
          <ArrowUpRight />
        </Link>
        <span>© 2026 Ethan Wang. All rights reserved.</span>
      </footer>
    </main>
  );
}