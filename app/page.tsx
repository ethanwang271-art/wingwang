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
  "site is a work in progress",
];

// ---- The rest of your about me: edit these ----
// The lens has 5 stops (f/1.8, 2.8, 4, 5.6, 8). The first one is "who am i?" above; these are stops 2 to 5 (keep it to 4).
// Each line in quotes inside `text` is one paragraph. After the last one, the camera zooms in through the aperture
// into your photos, videos and projects.
const ABOUT_MORE: { title: string; text: string[] }[] = [
  { title: "where i'm from", text: ["photographer based in Toronto"] },
  { title: "what i do", text: ["currently currentlying"] },
  { title: "why photos", text: ["photography has always been appealing to me"] },
  { title: "what's next", text: ["trying to develop new projects"] },
];

// ---- The part after the zoom (photos, videos, projects): edit these ----
// photos: which albums to show (the folder names inside public/photos). If one isn't found, another album fills its spot.
const HOME_ALBUMS = ["summer '26", "OASIS", "senior sunrise"];
// videos: the one video to feature. Put the file in public/videos/ and write its path, for example "/videos/reel.mp4".
// Leave src "" to show a "coming soon" box. poster = an optional picture shown before it plays.
const HOME_VIDEO = { title: "coming soon", caption: "the first videos are on the way.", src: "", poster: "" };
// projects: a short list. Copy the example block (without the //) to add one, newest first.
const HOME_PROJECTS: { date: string; title: string; text: string; href: string }[] = [
  // { date: "mar '26", title: "my project", text: "one line about it", href: "/projects" },
];

// how big the titles next to the lens are: grows with the screen width, from 36px (2.25rem) up to 76px (4.75rem).
// A long title wraps onto two lines rather than running into the lens.
const TITLE_SIZE = "clamp(2.25rem, 4.4vw, 4.75rem)";

// ---- "who am i?" shake (it wobbles while you scroll past it) ----
const SHAKE_PX = 3;        // how far each letter jiggles at most, in px
const SHAKE_DEG = 2;       // how much each letter tilts at most, in degrees
const SHAKE_SPEED = 2500;  // scroll speed (px per second) at which the shake is at full strength: lower = shakes more easily

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
const PAINT_COLOR = "255,190,110";  // r,g,b of the paint when you brush over the aperture blades (the same amber as the blades)


// hide the normal arrow (only on devices with a real mouse); it comes back when you leave this page
const CURSOR_CSS = `
@media (hover: hover) and (pointer: fine) {
  html, html * { cursor: none !important; }
}
.cursor-dot, .cursor-ring { transition: background-color .25s ease, border-color .25s ease, box-shadow .25s ease; }
/* over the aperture blades, where you can paint, the cursor becomes an amber brush */
html.brush-on .cursor-dot { background: rgb(${PAINT_COLOR}) !important; box-shadow: 0 0 14px rgba(${PAINT_COLOR},.9) !important; }
html.brush-on .cursor-ring { border-color: rgba(${PAINT_COLOR},.85) !important; mix-blend-mode: normal !important; }
`;

// the "Contact me" button: dark blue-tinted box, blue border, monospace text
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
    let raf = 0, last = performance.now();

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

      dot.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%) scale(${sc.toFixed(3)})`;
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
      <div ref={ringRef} aria-hidden="true" className="cursor-ring" style={{ ...base, width: CURSOR_RING, height: CURSOR_RING, border: "1px solid rgba(255,255,255,.4)", mixBlendMode: "difference" }} />
      <div ref={dotRef} aria-hidden="true" className="cursor-dot" style={{ ...base, width: CURSOR_DOT, height: CURSOR_DOT, background: `rgb(${BLUE})`, boxShadow: `0 0 10px rgba(${BLUE},.9)` }} />
    </>
  );
}

/* ---------- Wall intro: break through a concrete wall when you first arrive ---------- */

// ---- tweak these ----
const WALL_HITS = 4;                  // hits it takes to break through (keep it at 4 or less)
const WALL_PROMPT = "break the wall";       // the big text in the middle
const WALL_PROMPT_TOUCH = "break the wall"; // the same text on phones and tablets
const WALL_HOLE_SIZE = 1;             // how big the hole from each hit is (1 = normal, 1.5 = half as big again)
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
function drawRim(ctx: CanvasRenderingContext2D, cells: Cell[], out: boolean[], cx: number, cy: number, inset: (p: Pt) => Pt) {
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

// A black concrete wall covers the screen, with the camera behind it. Click it: each hit punches a hole
// right through (with real wall thickness around the edge), so you get a peek at what's behind. The last hit
// cracks the whole wall and it crumbles: big chunks fall down towards you and off the screen.
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

  // hits before the last one: knock a hole right through the wall. The pieces fall away behind it.
  const punch = (x: number, y: number, size: number) => {
    const rc = (46 + 22 * hits) * size * WALL_HOLE_SIZE;
    const cells = makeCells(x, y, rc * 3.2, 38, 1.15, rng(5000 + hits * 71 + Math.floor(x * 3 + y * 7)));
    const patch: Patch = { x, y, hit: hits, cells, out: cells.map((c) => c.pts.length >= 3 && c.d < rc), rc, depth: 0, final: false };
    patches.push(patch);
    const thick = 40 * size;
    holes.push({ patch, path: cellsPath(cells, patch.out), k: WALL_FOCAL / (WALL_FOCAL + thick) });
    cells.forEach((c, i) => {
      if (!patch.out[i]) return;
      const b = makeBody(c.pts, c.cx, c.cy, thick);
      const dx = c.cx - x, dy = c.cy - y, d = Math.hypot(dx, dy) || 1;
      b.z = thick / 2; // its front starts level with the front of the wall
      b.vx = (dx / d) * rand(20, 140);
      b.vy = (dy / d) * rand(20, 140) - rand(0, 100);
      b.vz = rand(500, 1300);
      b.wx = rand(-5.5, 5.5); b.wy = rand(-5.5, 5.5); b.wz = rand(-2.5, 2.5);
      b.max = b.life = 2;
      b.far = true;
      bodies.push(b);
    });
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
    if (!last) {
      punch(x, y, size);
      redrawCracks();
      spawnChips(x, y, 5 + hits * 2, 1);
      spawnPuffs(x, y, 2 + hits, 150);
      shakeT = 0.22;
      shakeAmp = 4 + hits * 2.5;
    }
    prompt.style.opacity = "0";
    dirty = true;
    if (last) breakWall(x, y);
  };

  const doHit = (x: number, y: number) => {
    if (busy || broken) return;
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
    ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
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
      for (const h of holes) drawRim(ctx, h.patch.cells, h.patch.out, W / 2, H / 2, inset(h.k));
      if (collapse && collapse.path) {
        cut(collapse.path);
        drawRim(ctx, collapse.patch.cells, collapse.patch.out, W / 2, H / 2, inset(collapse.k));
      }

      // the bits falling away behind the wall: painted BEHIND what's already there, so they only show through the holes
      if (bodies.some((b) => b.far)) {
        farx.setTransform(1, 0, 0, 1, 0, 0);
        farx.clearRect(0, 0, farC.width, farC.height);
        farx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
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

const CAMERA_HEIGHT = "720vh";              // how much scrolling the whole camera part takes (more = slower). The last screen of it is the zoom through the aperture
const CAMERA_FACE = 0.14;                   // how much of that scrolling it takes to turn the lens towards you and zoom in on it (0.14 = the first 14%)
const CAMERA_START_SIZE = 0.62;             // how big the whole camera is at the start (1 = as big as fits)
const CAMERA_LENS_SIZE = 0.44;              // how big the front of the lens is once zoomed in (0.44 = its radius is 44% of the screen height, so it nearly fills it top to bottom)
const CAMERA_DRAG = 3;                      // dragging sideways over the lens changes the stop too: higher = further per drag
const CAMERA_YAW = 0;                       // how far it's turned at the start, in degrees (0 = facing you straight on)
const CAMERA_TILT = 0;                      // how much you look down on it at the start, in degrees
const CAMERA_MOUSE = 6;                     // how much it leans to follow the mouse at the start, in degrees (0 = not at all)
const CAMERA_LINE = BLUE;                   // r,g,b of the body, cage and lens lines
const CAMERA_GLASS = "170,215,255";         // r,g,b of the glass inside the lens
const CAMERA_BLADES = "255,190,110";        // r,g,b of the aperture blades
const CAMERA_LIT = "255,255,255";           // r,g,b of the edge of the opening
const CAMERA_SNAP = 0.35;                   // when you stop scrolling between two stops, it glides to the nearest one in this many seconds (0 = off)
const CAMERA_FILL = 0.035;                  // how see-through the surfaces are (0 = only lines, higher = more solid)
const APERTURE_STOPS = [1.8, 2.8, 4, 5.6, 8]; // the f-number for each of the 5 about me sections, in order
const APERTURE_BLADES = 9;                  // how many blades the aperture has
const PAINT_GRID = 60;                      // how many little strokes fit across the blades (more = finer and denser)
const PAINT_BRUSH = 0.09;                   // how big the brush is, compared to the blades' ring (0.09 = about a tenth of it)

// where the camera is and which way it faces. stop = which section is showing (0 to 5, in between while changing),
// lit = how settled it is on that section (0 to 1), body = how visible the body is, lens = how visible the lens around
// the blades is (1 = fully, 0 = only the blades), iris = how bright the blades are, cx/cy = where it sits on the screen, scale = how big,
// paint = the strokes painted on the blades (m[k] = 0 not painted .. 1 fully painted), how strongly they show (a)
// and how visible the faint unpainted strokes are (dots), mask = while zooming through the aperture, everything outside the opening is blacked out (0 to 1),
// px/py/pz = the point on the model it turns around, depth = how strong the perspective is (higher = flatter)
type CameraPose = { paint: { m: Float32Array; a: number; dots: number } | null; mask: number; stop: number; lit: number; body: number; lens: number; iris: number; yaw: number; tilt: number; cx: number; cy: number; scale: number; px: number; py: number; pz: number; depth: number };

// The camera is a see-through 3D model made of lines, built from simple shapes: flat outlines given a thickness
// (body, grip, cage) and round shapes spun around a line (lens, dials). Then every point is turned, put in
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

// a flat outline with a thickness: one face at t0, the other at t1, and edges across at the corners
function prism(m: Model, d: string, t0: number, t1: number, col: string, at = FRONT, w = 1) {
  const { pts, corner } = pathPts(d);
  const f = pts.map((p) => at(p.x, p.y, t0)), b = pts.map((p) => at(p.x, p.y, t1));
  m.lines.push({ pts: f, closed: true, col, w }, { pts: b, closed: true, col, w });
  pts.forEach((_, i) => { if (corner[i]) m.lines.push({ pts: [f[i], b[i]], closed: false, col, w: 0.6 * w }); });
  m.faces.push({ pts: f, col, w }, { pts: b, col, w });
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

function buildCamera(view: V3, body: number, lens: number): Model {
  const m: Model = { lines: [], faces: [] };
  const G = CAMERA_LINE, GL = CAMERA_GLASS;

  // ---- the body (a small mirrorless camera, no logos) ----
  prism(m, "M -300 -110 Q -300 -140 -270 -140 L -120 -140 L -96 -226 Q -92 -238 -78 -238 L 78 -238 Q 92 -238 96 -226 L 120 -140 L 270 -140 Q 300 -140 300 -110 L 300 180 Q 300 210 270 210 L -270 210 Q -300 210 -300 180 Z", 0, 170, G);
  // the grip, sticking out at the front on the left
  prism(m, "M 0 -140 L -70 -140 Q -150 -128 -152 -40 L -152 150 Q -150 208 -95 210 L 0 210 Z", -296, -176, G, SIDE);
  // shutter button and the dials on top
  spin(m, [[-140, 22, true], [-156, 22, true], [-161, 15, true]], "y", -236, -92, G, view, 0.8);
  spin(m, [[-140, 46, true], [-168, 46, true]], "y", -150, 80, G, view, 0.8);
  spin(m, [[-140, 38, true], [-160, 38, true]], "y", 180, 84, G, view, 0.8);
  // viewfinder eyecup and the screen on the back
  prism(m, "M -84 -230 Q -84 -236 -76 -236 L 76 -236 Q 84 -236 84 -230 L 84 -122 L -84 -122 Z", 170, 236, G);
  outline(m, "M -40 -112 L 272 -112 L 272 190 L -40 190 Z", 172, G);

  // on the front: the lens release button beside the mount, and the little lamp on the grip
  circle(m, "z", 196, 70, -1, 15, G, 0.6);
  circle(m, "z", -214, -96, -150, 9, G, 0.5);

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
    for (const [z0, z1] of [[-164, -294], [-339, -434]]) {
      m.lines.push({ pts: [around("z", LENS_X, LENS_Y, z0, LENS_R + 1, a), around("z", LENS_X, LENS_Y, z1, LENS_R + 1, a)], closed: false, col: G, w: 0.18 });
    }
  }
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

// The little strokes that fill the blades when you paint them: a grid of short horizontal dashes, worked out once,
// as positions inside a circle of radius 1 (u = across, v = down). jit makes the brush edge a little ragged.
const PAINT_MARKS: { u: number; v: number; jit: number }[] = (() => {
  const out: { u: number; v: number; jit: number }[] = [];
  const n = PAINT_GRID, cell = 2 / n;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const u = -1 + (col + 0.5) * cell + (row % 2 ? cell * 0.25 : -cell * 0.25); // rows sit a little offset, like brick
      const v = -1 + (row + 0.5) * cell;
      if (u * u + v * v > 0.93) continue;
      const h = Math.sin(row * 127.1 + col * 311.7) * 43758.5453;
      out.push({ u, v, jit: 0.75 + 0.5 * (h - Math.floor(h)) });
    }
  }
  return out;
})();

// where the blades are on the screen: their middle, the radius of their ring, and the opening's corners
type IrisSpot = { x: number; y: number; r: number; hole: Pt[] };
// is a point on the blades (inside the ring, outside the opening)?
const onBlades = (sp: IrisSpot, x: number, y: number) => Math.hypot(x - sp.x, y - sp.y) < sp.r * 0.965 && !inPoly(sp.hole, x, y);

// the f-number at any point while scrolling (in between two stops it's part way between them)
function fNumber(stop: number): number {
  const s = clamp(stop, 0, APERTURE_STOPS.length - 1), i = Math.min(APERTURE_STOPS.length - 2, Math.floor(s));
  return APERTURE_STOPS[i] + (APERTURE_STOPS[i + 1] - APERTURE_STOPS[i]) * (s - i);
}

// draw the model in a pose (yaw/tilt in radians)
function drawCamera(ctx: CanvasRenderingContext2D, o: CameraPose): IrisSpot | null {
  let spot: IrisSpot | null = null;
  const cY = Math.cos(o.yaw), sY = Math.sin(o.yaw), cT = Math.cos(o.tilt), sT = Math.sin(o.tilt);
  // which way you're looking, in the model's own directions
  const view = { x: -sY * cT, y: sT, z: cY * cT };
  const m = buildCamera(view, o.body, o.lens);

  const s = o.scale, F = o.depth;
  const proj = (p: V3) => {
    const X = p.x - o.px, Y = p.y - o.py, Z = p.z - o.pz;
    const x1 = X * cY + Z * sY, z1 = -X * sY + Z * cY;
    const y2 = Y * cT - z1 * sT, z2 = Y * sT + z1 * cT;
    const k = F / (F + z2);
    return { x: o.cx + x1 * s * k, y: o.cy + y2 * s * k, z: z2 };
  };
  const trace = (path: CanvasRenderingContext2D | Path2D, pts: V3[], closed: boolean) => {
    pts.forEach((p, i) => { const q = proj(p); if (i) path.lineTo(q.x, q.y); else path.moveTo(q.x, q.y); });
    if (closed) path.closePath();
  };

  ctx.save();
  // zooming through: black out everything but the opening, so what's behind the camera shows through it
  if (o.mask > 0) {
    const fN = fNumber(o.stop), r = IRIS_R * 0.94 * (APERTURE_STOPS[0] / fN), rot = -0.25 + (1 - r / IRIS_R) * 1.2;
    const cover = new Path2D();
    cover.rect(-1e5, -1e5, 2e5, 2e5);
    trace(cover, Array.from({ length: APERTURE_BLADES }, (_, i) => {
      const a = rot + (i / APERTURE_BLADES) * Math.PI * 2;
      return { x: LENS_X + r * Math.cos(a), y: LENS_Y + r * Math.sin(a), z: IRIS_Z };
    }), true);
    ctx.fillStyle = `rgba(${PAGE_BLACK},${o.mask.toFixed(3)})`;
    ctx.fill(cover, "evenodd");
  }
  // everything adds light on top of what's under it, so overlapping see-through parts glow a little more
  ctx.globalCompositeOperation = "lighter";

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

  // ---- the aperture blades. The opening shrinks from f/1.8 (wide open) to f/11 (tiny), and the blades
  // turn a little as it closes, like a real lens. ----
  if (o.iris > 0.01) {
    const N = APERTURE_BLADES, R = IRIS_R, fN = fNumber(o.stop);
    const r = R * 0.94 * (APERTURE_STOPS[0] / fN); // the opening's size: halves for every two stops
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
    // where the blades are on the screen (for painting)
    const c0 = proj(at(0, 0)), e0 = proj(at(R, 0));
    const sp: IrisSpot = { x: c0.x, y: c0.y, r: Math.hypot(e0.x - c0.x, e0.y - c0.y), hole: v.map((p) => { const q = proj(at(p.x, p.y)); return { x: q.x, y: q.y }; }) };
    spot = sp;
    // the paint, under the edges so they stay crisp: faint unpainted strokes, and the painted ones in amber
    if (o.paint && (o.paint.dots > 0 || o.paint.a > 0)) {
      const pt = o.paint, sr = sp.r, cell = (2 * sr) / PAINT_GRID, sw = cell * 0.72, sh = Math.max(1, cell * 0.36);
      const faint = new Path2D(), lit = [new Path2D(), new Path2D(), new Path2D(), new Path2D()]; // painted, in 4 steps of brightness
      PAINT_MARKS.forEach((k, i) => {
        const x = sp.x + k.u * sr, y = sp.y + k.v * sr;
        if (inPoly(sp.hole, x, y)) return; // nothing in the opening
        const val = pt.m[i];
        if (val > 0) {
          const grow = 0.55 + 0.45 * val; // each stroke grows to full length as it's painted
          lit[Math.min(3, Math.floor(val * 4))].rect(x - (sw * grow) / 2, y - sh / 2, sw * grow, sh);
        } else if (pt.dots > 0) faint.rect(x - sw / 2, y - sh / 2, sw, sh);
      });
      ctx.globalCompositeOperation = "source-over";
      if (pt.dots > 0) {
        ctx.fillStyle = `rgba(${PAINT_COLOR},${(0.09 * pt.dots).toFixed(3)})`;
        ctx.fill(faint);
      }
      lit.forEach((path, i) => {
        ctx.fillStyle = `rgba(${PAINT_COLOR},${((0.35 + 0.65 * ((i + 1) / 4)) * pt.a).toFixed(3)})`;
        ctx.fill(path);
      });
      ctx.globalCompositeOperation = "lighter";
    }
    // each blade's edge carries on past the corner of the opening, curving a little, out to the housing
    const edges = new Path2D();
    for (let i = 0; i < N; i++) {
      const a = v[i], b = v[(i + 1) % N];
      let dx = b.x - a.x, dy = b.y - a.y;
      const dl = Math.hypot(dx, dy) || 1;
      dx /= dl; dy /= dl;
      // how far along that line the housing is: |b + t*d| = R
      const pb = b.x * dx + b.y * dy, t = -pb + Math.sqrt(Math.max(0, pb * pb - (b.x * b.x + b.y * b.y - R * R)));
      const bend = t * 0.1;
      const pts: V3[] = [];
      for (let k = 0; k <= 10; k++) {
        const u = k / 10, off = Math.sin(u * Math.PI) * bend;
        pts.push(at(b.x + dx * t * u - dy * off, b.y + dy * t * u + dx * off));
      }
      trace(edges, pts, false);
      // the pin at the outer end of each blade: they slide round the housing as the blades turn
      const ex = b.x + dx * t, ey = b.y + dy * t;
      trace(edges, Array.from({ length: 16 }, (_, k) => at(ex * 0.93 + 5 * Math.cos((k / 16) * Math.PI * 2), ey * 0.93 + 5 * Math.sin((k / 16) * Math.PI * 2))), true);
    }
    glowLine(edges, CAMERA_BLADES, 0.75 * o.iris, 1);
    // the edge of the opening
    const hole = new Path2D();
    trace(hole, v.map((p) => at(p.x, p.y)), true);
    glowLine(hole, mixRgb(CAMERA_BLADES, CAMERA_LIT, 0.4 + 0.6 * o.lit), (0.7 + 0.3 * o.lit) * o.iris, 1.3);
  }

  ctx.restore();
  return spot;
}

// mix two "r,g,b" colours: t = 0 gives a, t = 1 gives b
function mixRgb(a: string, b: string, t: number): string {
  const x = a.split(",").map(Number), y = b.split(",").map(Number);
  return x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",");
}

/* ---------- Page ---------- */

export default function Home() {
  const aboutTitleRef = useRef<HTMLHeadingElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const camRef = useRef<HTMLElement>(null);
  const camCanvasRef = useRef<HTMLCanvasElement>(null);
  const camHintRef = useRef<HTMLDivElement>(null);
  const camDragRef = useRef<HTMLDivElement>(null);
  const camStageRef = useRef<HTMLDivElement>(null);
  // your photo albums, for the photos part after the zoom (read from public/photos by app/api/albums/route.ts)
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
  const panelEls = useRef<(HTMLDivElement | null)[]>([]); // the info for each stop

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

  // The camera. As you scroll: first it turns its lens towards you and zooms in until only the lens is left
  // (the body and cage fade away). Then the aperture steps down one stop at a time, from f/1.8 to f/11;
  // each stop shows one section's info next to the lens. You can also drag sideways over the lens.
  // At the start it leans a little towards the mouse and sways gently, so you can see it's 3D.
  useEffect(() => {
    const box = camRef.current, cv = camCanvasRef.current, hint = camHintRef.current, drag = camDragRef.current, stage = camStageRef.current;
    const c = cv?.getContext("2d");
    if (!box || !cv || !c) return;
    let raf = 0, last = performance.now(), ps = 0, w = 0, h = 0, dpr = 1, tv = 0;
    let mx = 0, my = 0, ex = 0, ey = 0;
    let dragging = false, lastX = 0;
    // painting the blades: how far each stroke is painted, how strongly they show, and whether they're fading away
    const paint = { m: new Float32Array(PAINT_MARKS.length), a: 1, fade: false, any: false };
    let spot: IrisSpot | null = null, section = 0, brush = false, cx0 = -1e4, cy0 = -1e4, lastPx = -1e4, lastPy = -1e4;
    let lastScroll = performance.now(), snapping = false, snapAt = 0; // when the page last moved, and whether it is gliding to a stop
    const onScroll = () => { if (!snapping) lastScroll = performance.now(); };
    const size = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    };
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      cx0 = e.clientX;
      cy0 = e.clientY;
      if (dragging) {
        // dragging left moves on to the next stop (it scrolls the page for you)
        const d = (lastX - e.clientX) * CAMERA_DRAG;
        lastX = e.clientX;
        const l = lenisRef.current;
        if (l) l.scrollTo(l.targetScroll + d, { immediate: true });
        else window.scrollBy(0, d);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return; // on phones, swiping already scrolls
      dragging = true;
      lastX = e.clientX;
      e.preventDefault();
    };
    const onUp = () => { dragging = false; };
    size();
    window.addEventListener("resize", size);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });
    cv.addEventListener("pointerdown", onDown);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const deg = Math.PI / 180;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const br = box.getBoundingClientRect();
      const p = clamp(-br.top / Math.max(1, br.height - h), 0, 1);
      ps += (p - ps) * (1 - Math.exp(-dt * 9)); // smooth out the scrolling
      ex += (mx - ex) * (1 - Math.exp(-dt * 3));
      ey += (my - ey) * (1 - Math.exp(-dt * 3));

      const A = CAMERA_FACE;
      const n = APERTURE_STOPS.length;
      const f = smooth(0, A, ps); // 0 = the whole camera, 1 = zoomed in on the lens
      // the last screen's worth of scrolling is the zoom through the aperture (it lines up with the next part sliding up)
      const Z = clamp(1 - h / Math.max(1, br.height - h), A + 0.05, 1);
      const zoom = clamp((p - Z) / Math.max(1e-6, 1 - Z), 0, 1);
      // in between, the scrolling is split into one stop each
      const u = clamp((ps - A) / (Z - A), 0, 1) * n;
      const k = Math.min(n - 1, Math.floor(u));
      const target = Math.min(n - 1, k + smooth(0.6, 1, u - k));
      tv += (target - tv) * (1 - Math.exp(-dt * 6)); // glides after the scroll and settles softly on each stop
      const shown = smooth(A * 0.8, A, ps) * (1 - smooth(0, 0.25, zoom));
      const lit = APERTURE_STOPS.map((_, i) => (1 - clamp(Math.abs(tv - i) * 2, 0, 1)) * shown);

      // Painting: once zoomed in, moving the pointer over the amber blades paints them in with little strokes.
      // When the aperture moves on to the next stop, the paint fades away.
      if (Math.round(tv) !== section) {
        section = Math.round(tv);
        if (paint.any) paint.fade = true;
      }
      let over = false;
      const cr = cv.getBoundingClientRect();
      const px = cx0 - cr.left, py = cy0 - cr.top;
      if (shown > 0.95 && zoom === 0 && !paint.fade && spot) {
        const sp = spot;
        over = onBlades(sp, px, py);
        // brush every stroke near the line the pointer moved along since the last frame (so fast swipes don't skip)
        const bw = sp.r * PAINT_BRUSH;
        const seg = Math.hypot(px - lastPx, py - lastPy);
        const steps = seg > sp.r * 2 ? 1 : Math.max(1, Math.ceil(seg / (bw * 0.4)));
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const bx = steps === 1 ? px : lastPx + (px - lastPx) * t, by = steps === 1 ? py : lastPy + (py - lastPy) * t;
          if (Math.hypot(bx - sp.x, by - sp.y) > sp.r + bw) continue;
          PAINT_MARKS.forEach((mk, j) => {
            if (paint.m[j] !== 0) return;
            const x = sp.x + mk.u * sp.r, y = sp.y + mk.v * sp.r;
            if (Math.hypot(x - bx, y - by) < bw * mk.jit && !inPoly(sp.hole, x, y)) {
              paint.m[j] = 0.01;
              paint.any = true;
            }
          });
        }
      }
      lastPx = px;
      lastPy = py;
      if (paint.fade) {
        paint.a -= dt / 0.45;
        if (paint.a <= 0) { paint.m.fill(0); paint.a = 1; paint.fade = false; paint.any = false; }
      } else if (paint.any) {
        // painted strokes light up quickly, one after another, as the brush passes
        for (let j = 0; j < paint.m.length; j++) if (paint.m[j] > 0 && paint.m[j] < 1) paint.m[j] = Math.min(1, paint.m[j] + dt * 7);
      }
      if (over !== brush) {
        brush = over;
        document.documentElement.classList.toggle("brush-on", over);
      }

      // Snapping: if the page stops while the aperture is changing between two stops (where neither one's
      // info can be clicked), glide on to whichever stop is closer.
      const l = lenisRef.current;
      if (snapping && now - snapAt > CAMERA_SNAP * 1000 + 400) snapping = false; // in case a new scroll cut the glide short
      if (CAMERA_SNAP > 0 && l && !snapping && !dragging && !l.isTouching && !l.isScrolling && now - lastScroll > 200) {
        const pu = clamp((p - A) / (Z - A), 0, 1) * n, pk = Math.floor(pu), pf = pu - pk;
        if (p < Z && pk < n - 1 && pf > 0.6) {
          const goal = pf < 0.8 ? pk + 0.5 : pk + 1.05; // just inside the resting spot of the nearer stop
          const y = window.scrollY + br.top + (A + (goal / n) * (Z - A)) * (br.height - h);
          snapping = true;
          snapAt = now;
          l.scrollTo(y, { duration: CAMERA_SNAP, onComplete: () => { snapping = false; lastScroll = performance.now(); } });
        }
      }

      if (br.bottom > 0 && br.top < window.innerHeight) {
        const small = w < 768; // phones: the lens sits at the top and the info goes underneath
        // at the start: the whole camera, facing you, in the middle of the screen
        const sStart = small ? Math.min((w * 0.62) / 760, (h * 0.5) / 720) : Math.min((w * 0.8) / 1000, (h * 0.75) / 720) * CAMERA_START_SIZE;
        // zoomed in: the whole front of the lens, facing you, to the right of the info (above it on phones)
        const rad = small ? Math.min(h * 0.21, w * 0.44) : Math.min(h * CAMERA_LENS_SIZE, w * 0.27);
        const sLens = rad / LENS_R;
        // then through the aperture: it grows until the opening is bigger than the screen
        // (0.88 = how much smaller the blades look than the front of the lens, as they sit further in)
        const rOpen = IRIS_R * 0.94 * (APERTURE_STOPS[0] / APERTURE_STOPS[n - 1]) * Math.cos(Math.PI / APERTURE_BLADES) * 0.88;
        const sThrough = (Math.hypot(w, h) / 2 / rOpen) * 1.08;
        const zEase = zoom * zoom; // starts slowly, then rushes in
        const move = smooth(0, 0.6, zoom); // the opening slides to the middle of the screen
        const z = f * f; // the zoom speeds up towards the end, like a camera pushing in
        const t = now / 1000;
        const wob = 1 - f; // it stops leaning and swaying once zoomed in, so the lens sits perfectly still
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.clearRect(0, 0, w, h);
        spot = null;
        if (zoom < 0.999) {
          spot = drawCamera(c, {
            paint: { m: paint.m, a: paint.a, dots: smooth(0.95, 1, shown) },
            mask: zoom > 0 ? 1 : 0,
            stop: tv,
            lit: Math.max(...lit),
            body: 1 - smooth(0.25, 0.65, f),
            lens: 1 - smooth(0, 0.45, zoom), // the rest of the lens fades as you go through, leaving the blades
            iris: 0.4 + 0.6 * f,
            yaw: (lerp(CAMERA_YAW, 0, f) + (ex * CAMERA_MOUSE + Math.sin(t * 0.6) * 1.5) * wob) * deg,
            tilt: (lerp(CAMERA_TILT, 0, f) + (ey * CAMERA_MOUSE * 0.5 + Math.sin(t * 0.45)) * wob) * deg,
            cx: lerp(lerp(w / 2, small ? w / 2 : w - rad - w * 0.05, f), w / 2, move),
            cy: lerp(lerp(h / 2, small ? h * 0.27 : h * 0.5, f), h / 2, move),
            scale: lerp(sStart, sLens, z) * Math.pow(sThrough / sLens, zEase),
            px: lerp(0, LENS_X, f),
            py: lerp(0, LENS_Y, f),
            pz: lerp(-150, LENS_FRONT, f),
            depth: lerp(4000, 1600, f), // flatter at the start, so the lens isn't blown up in front of the body
          });
        }
      }
      // once you're through, the camera stops catching clicks so the part underneath can be used
      if (stage) stage.style.pointerEvents = zoom > 0.5 ? "none" : "";
      // the info for each stop fades in while it's showing
      panelEls.current.forEach((el, i) => {
        if (!el) return;
        const v = lit[i];
        el.style.opacity = String(v);
        el.style.transform = `translate3d(0,${((1 - v) * 24).toFixed(1)}px,0)`;
        el.style.visibility = v < 0.01 ? "hidden" : "visible";
        el.style.pointerEvents = v > 0.6 ? "auto" : "none";
      });
      if (hint) hint.style.opacity = String(1 - smooth(0, 0.03, ps));
      if (drag) drag.style.opacity = String(shown);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      cv.removeEventListener("pointerdown", onDown);
      document.documentElement.classList.remove("brush-on");
    };
  }, []);

  // "who am i?" wobbles while you scroll: each letter jiggles a little, more the faster you scroll
  useEffect(() => {
    const title = aboutTitleRef.current;
    if (!title) return;
    const chars: HTMLElement[] = Array.from(title.querySelectorAll<HTMLElement>(".shake-ch"));
    let raf = 0, last = performance.now(), lastY = window.scrollY, vs = 0, shaking = false;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const y = window.scrollY;
      const v = Math.abs(y - lastY) / Math.max(dt, 0.001);
      lastY = y;
      vs += (v - vs) * (1 - Math.exp(-dt * 8)); // smooth, so it ramps up and settles instead of twitching

      const r = title.getBoundingClientRect();
      const inView = r.bottom > 0 && r.top < window.innerHeight;
      const amp = inView ? Math.pow(clamp(vs / SHAKE_SPEED, 0, 1), 0.8) : 0;

      if (amp > 0.01) {
        shaking = true;
        const t = now / 1000;
        chars.forEach((el, i) => {
          const x = Math.sin(t * 38 + i * 1.7) * amp * SHAKE_PX;
          const yy = Math.cos(t * 31 + i * 2.3) * amp * SHAKE_PX * 0.7;
          const rot = Math.sin(t * 27 + i * 1.1) * amp * SHAKE_DEG;
          el.style.transform = `translate3d(${x.toFixed(2)}px,${yy.toFixed(2)}px,0) rotate(${rot.toFixed(2)}deg)`;
        });
      } else if (shaking) {
        shaking = false;
        chars.forEach((el) => { el.style.transform = ""; });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main className="relative text-white" style={{ background: `rgb(${PAGE_BLACK})` }}>

      {/* the page's main heading: screen readers and Google read it, it isn't shown */}
      <h1 className="sr-only">Ethan Wang: photography, and a bit about me</h1>

      {/* the wall (only when you first arrive) */}
      {introOn && <WallIntro onBreak={() => setPhase("breaking")} onDone={() => setPhase("none")} />}

      {/* dot + trailing ring cursor (it shows on the wall too) */}
      <Cursor />

      <style>{INTRO_CSS + LENIS_CSS + CURSOR_CSS + CONTACT_CSS + BG_CSS + WALL_CSS}</style>

      {/* The camera behind the wall. Scrolling through this tall block zooms in on its lens, then steps the aperture
          down one stop at a time (edit ABOUT_TITLE, ABOUT_TEXT and ABOUT_MORE at the top). Then it zooms in through
          the aperture, and the photos, videos and projects underneath show through the opening. */}
      <section ref={camRef} className="relative -mt-16" style={{ height: CAMERA_HEIGHT }}>
        <div ref={camStageRef} className="sticky top-0 z-10 h-dvh w-full overflow-hidden">
          <canvas ref={camCanvasRef} role="img" aria-label="A see-through 3D camera with a zoom lens" className="absolute inset-0 h-full w-full" />

          {/* the info for each stop: to the left of the lens (underneath it on phones) */}
          <div className="pointer-events-none absolute inset-x-6 bottom-6 top-[50%] md:inset-y-0 md:left-[7%] md:right-auto md:w-[34%]">
            {/* stop 1 (f/1.8): who am i? */}
            <div
              ref={(el) => { panelEls.current[0] = el; }}
              className="absolute inset-0 flex items-start md:items-center"
              style={{ opacity: 0, visibility: "hidden" }}
            >
              <div className="w-full">
                <div>
                  <p className="mb-3 text-sm font-bold tracking-[0.2em] sm:text-base lg:mb-4" style={{ color: `rgb(${CAMERA_BLADES})` }}>f/{APERTURE_STOPS[0]}</p>
                  <h2
                    ref={aboutTitleRef}
                    aria-label={ABOUT_TITLE}
                    className="whitespace-nowrap font-bold leading-[1.02] tracking-tight"
                    style={{ fontSize: TITLE_SIZE }}
                  >
                    {ABOUT_TITLE.split(" ").map((word, wi, words) => (
                      <span key={wi} aria-hidden="true">
                        <span className="inline-block whitespace-nowrap">
                          {word.split("").map((ch, ci) => (
                            <span key={ci} className="shake-ch inline-block will-change-transform">{ch}</span>
                          ))}
                        </span>
                        {wi < words.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </h2>
                  <div className="mt-6 space-y-4 text-base leading-relaxed text-neutral-400 sm:text-xl lg:mt-8 lg:text-2xl">
                    {ABOUT_TEXT.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* stops 2 to 5: the rest of your about me */}
            {ABOUT_MORE.slice(0, APERTURE_STOPS.length - 1).map((ch, i) => (
              <div
                key={i}
                ref={(el) => { panelEls.current[i + 1] = el; }}
                className="absolute inset-0 flex items-start md:items-center"
                style={{ opacity: 0, visibility: "hidden" }}
              >
                <div className="max-w-2xl">
                  <p className="mb-3 text-sm font-bold tracking-[0.2em] sm:text-base lg:mb-4" style={{ color: `rgb(${CAMERA_BLADES})` }}>f/{APERTURE_STOPS[i + 1]}</p>
                  <h2 className="font-bold leading-[1.02] tracking-tight [text-wrap:balance]" style={{ fontSize: TITLE_SIZE }}>{ch.title}</h2>
                  <div className="mt-6 space-y-4 text-base leading-relaxed text-neutral-400 sm:text-xl lg:mt-8 lg:text-2xl">
                    {ch.text.map((paragraph, j) => (
                      <p key={j}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* like a carousel: you can drag over the lens too */}
          <div ref={camDragRef} className="pointer-events-none absolute bottom-8 left-[7%] hidden text-xs uppercase tracking-[0.3em] text-neutral-500 md:block" style={{ opacity: 0 }}>
            drag / scroll
          </div>

          <div ref={camHintRef} className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-xs uppercase tracking-[0.3em] text-neutral-400">
            scroll
            <span className="sc-hint block h-10 w-px bg-white/60" />
          </div>
        </div>
      </section>

      {/* What you zoom into through the aperture: photos, videos and projects, laid out one after another.
          It starts tucked up under the last screen of the camera (the -100dvh), so it's what shows through the opening. */}
      <div className="relative" style={{ marginTop: "-100dvh" }}>
        <div className="mx-auto max-w-5xl px-6 pb-28 pt-24 sm:pt-28">
          {/* photos */}
          <section aria-labelledby="home-photos">
            <h2 id="home-photos" className="text-4xl font-bold tracking-tight sm:text-5xl">photos</h2>
            <p className="mt-4 text-lg text-neutral-400 sm:text-xl">
              {albums.length > 0 ? `${albums.length} albums so far. the latest three:` : "albums from my camera roll."}
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-3 sm:gap-5">
              {featured.map((a) => (
                <Link key={a.id} href={`/photos/${encodeURIComponent(a.id)}`} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-900">
                    {a.cover && (
                      <Image src={a.cover} alt={`${a.title}: album cover`} fill sizes="(min-width: 640px) 30vw, 92vw" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold sm:text-xl">{a.id}</h3>
                  <p className="mt-1 text-neutral-400">{a.description}</p>
                </Link>
              ))}
            </div>
            <Link href="/photos" className="mt-8 inline-block font-mono text-base hover:underline sm:text-lg" style={{ color: `rgb(${BLUE})` }}>
              see all {albums.length || ""} albums &rarr;
            </Link>
          </section>

          {/* videos */}
          <section aria-labelledby="home-videos" className="mt-28">
            <h2 id="home-videos" className="text-4xl font-bold tracking-tight sm:text-5xl">videos</h2>
            <div className="relative mt-8 aspect-video overflow-hidden rounded-xl bg-neutral-900">
              {HOME_VIDEO.src ? (
                <video className="h-full w-full object-cover" src={HOME_VIDEO.src} poster={HOME_VIDEO.poster || undefined} controls playsInline preload="metadata" />
              ) : (
                <>
                  {/* the play button, until there's a video */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/5 sm:h-20 sm:w-20">
                      <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 text-white/70 sm:h-7 sm:w-7" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-5 sm:bottom-6 sm:left-7">
                    <p className="text-lg font-semibold sm:text-2xl">{HOME_VIDEO.title}</p>
                  </div>
                </>
              )}
            </div>
            <p className="mt-4 text-neutral-400 sm:text-lg">{HOME_VIDEO.caption}</p>
            <Link href="/videos" className="mt-6 inline-block font-mono text-base hover:underline sm:text-lg" style={{ color: `rgb(${BLUE})` }}>
              see videos &rarr;
            </Link>
          </section>

          {/* projects */}
          <section aria-labelledby="home-projects" className="mt-28">
            <h2 id="home-projects" className="text-4xl font-bold tracking-tight sm:text-5xl">projects</h2>
            {HOME_PROJECTS.length === 0 ? (
              <p className="mt-4 text-lg text-neutral-400 sm:text-xl">coming soon</p>
            ) : (
              <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
                {HOME_PROJECTS.map((pj, i) => (
                  <li key={i}>
                    <Link href={pj.href} className="group flex items-baseline gap-5 py-5 sm:gap-8">
                      <span className="w-20 shrink-0 text-sm text-neutral-500 sm:w-24">{pj.date}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-semibold sm:text-xl">{pj.title}</span>
                        <span className="mt-1 block text-neutral-400">{pj.text}</span>
                      </span>
                      <span className="text-neutral-500 transition group-hover:translate-x-1 group-hover:text-white" aria-hidden="true">&rarr;</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/projects" className="mt-6 inline-block font-mono text-base hover:underline sm:text-lg" style={{ color: `rgb(${BLUE})` }}>
              see projects &rarr;
            </Link>
          </section>
        </div>
      </div>

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