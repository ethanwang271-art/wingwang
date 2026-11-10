"use client";
// app/page.tsx  (everything for the home page lives in this one file)

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import Lenis from "lenis";

// TODO: paste the link to your Google Doc resume here (in Google Docs: Share -> set to "Anyone with the link" -> Copy link)
const RESUME_URL = "roblox.com";

// ---- About me section: edit these ----
const ABOUT_TITLE = "who am i?";
// Each line in quotes is one paragraph. Change them, add more, or delete some.
const ABOUT_TEXT = [
  "hi my names ethan",
  "site is not finished :(",
];

// ---- What's in the revolver's chambers: edit these ----
// The cylinder has 6 chambers. The first one is "who am i?" above; these are chambers 2 to 6 (keep it to 5).
// `link` is optional: a page on your site ("/photos") or a full web address. Delete the link line to have no button.
const CHAMBERS: { title: string; text: string; link?: { label: string; href: string } }[] = [
  { title: "photos", text: "i like taking photos", link: { label: "see my photos", href: "/photos" } },
  { title: "videos", text: "work in progress. stay tuned :D" },
  { title: "résumé", text: "for work", link: { label: "open my résumé", href: RESUME_URL } },
  { title: "contact", text: "contact me hereee", link: { label: "contact me", href: "/contact" } },
  { title: "more soon", text: ":)" },
];

// ---- "who am i?" shake (it wobbles while you scroll past it) ----
const SHAKE_PX = 3;        // how far each letter jiggles at most, in px
const SHAKE_DEG = 2;       // how much each letter tilts at most, in degrees
const SHAKE_SPEED = 2500;  // scroll speed (px per second) at which the shake is at full strength: lower = shakes more easily

const PAGE_CSS = `
/* a vintage polaroid: same outer size as the old frame (4:5), thick bottom border, no caption */
.polaroid {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  padding: 5.5% 5.5% 0;
  border-radius: 3px;
  background:
    linear-gradient(145deg, rgba(255,255,255,.55), rgba(255,255,255,0) 40%),
    linear-gradient(160deg, #f1ecdf, #e4dccb);
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.35),
    inset 0 0 32px rgba(140,105,50,.22),
    0 2px 4px rgba(0,0,0,.5),
    0 40px 70px -24px rgba(0,0,0,.9);
  transform: rotate(-2.2deg);
  transition: transform .7s cubic-bezier(.34,1.56,.64,1);
}
.polaroid:hover { transform: rotate(0deg) scale(1.02); }
/* the photo window: sized so the polaroid's bottom border is about 4x the side borders */
.polaroid-window {
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 0.913;
  background: #171717;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.35);
}
`;

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
const NAVBAR = 64;            // navbar height in px (h-16)

// ---- colours ----
const PAGE_BLACK = "11,13,15";    // r,g,b of the page's black (taken from your swatch)
const BLUE = "100,159,255";       // r,g,b of the blue (taken from your new swatch, #649FFF). Used by the line, the glow, the button and the cursor

/* ---------- Blue side glow + custom cursor ---------- */

// ---- tweak these ----
const GLOW_X = 100;               // which side the glow comes from: 100 = right edge, 0 = left edge
const GLOW_STRENGTH = 0.42;       // 0 = off, 1 = very strong
const CURSOR_DOT = 8;             // size of the dot in px
const CURSOR_RING = 38;           // size of the ring in px
const CURSOR_FOLLOW = 9;          // how quickly the ring catches up with the dot (lower = lazier, more delay)
const CURSOR_HOVER_SCALE = 1.7;   // the ring grows this much over links and buttons (1 = never grows)

// a blue glow that bleeds in from one side of the screen, like the orange one on sunny.patel
const SIDE_GLOW = `radial-gradient(ellipse 60% 90% at ${GLOW_X}% 55%, rgba(${BLUE},${GLOW_STRENGTH}), transparent 70%)`;

// hide the normal arrow (only on devices with a real mouse); it comes back when you leave this page
const CURSOR_CSS = `
@media (hover: hover) and (pointer: fine) {
  html, html * { cursor: none !important; }
}
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
      <div ref={ringRef} aria-hidden="true" style={{ ...base, width: CURSOR_RING, height: CURSOR_RING, border: "1px solid rgba(255,255,255,.4)", mixBlendMode: "difference" }} />
      <div ref={dotRef} aria-hidden="true" style={{ ...base, width: CURSOR_DOT, height: CURSOR_DOT, background: `rgb(${BLUE})`, boxShadow: `0 0 10px rgba(${BLUE},.9)` }} />
    </>
  );
}

/* ---------- Wall intro: break through a concrete wall when you first arrive ---------- */

// ---- tweak these ----
const WALL_HITS = 4;                  // hits it takes to break through (keep it at 4 or less)
const WALL_PROMPT = "break the wall";       // the big text in the middle
const WALL_PROMPT_TOUCH = "break the wall"; // the same text on phones and tablets
const WALL_SOUND = true;              // thud sounds when you hit the wall
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
  life: number; max: number; tone: number; side: number; far: boolean;
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
const WALL_MAX_PIXELS = 1_700_000;                    // lower = runs faster, a little less sharp

// Break the area around (x, y) into pieces, the way real concrete shatters: small pieces near the hit,
// bigger ones further out. (This is a Voronoi pattern: every piece is the area closest to one random point.)
function makeCells(x: number, y: number, radius: number, count: number, power: number, r: () => number): Cell[] {
  const sites: Pt[] = [{ x: x + (r() - 0.5) * radius * 0.06, y: y + (r() - 0.5) * radius * 0.06 }];
  const minD = radius * 0.085;
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
    life: 1, max: 1, tone: 22, side: 70, far: false,
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

// thud + rubble, made from scratch with the browser's audio (no sound files needed)
let audioCtx: AudioContext | null = null;
function getAudio(): AudioContext | null {
  if (!WALL_SOUND) return null;
  if (audioCtx) return audioCtx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  audioCtx = new AC();
  return audioCtx;
}
function playThud(big: boolean) {
  const ac = getAudio();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const t = ac.currentTime;
  const dur = big ? 1.1 : 0.35;

  const osc = ac.createOscillator();
  const og = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(big ? 90 : 120, t);
  osc.frequency.exponentialRampToValueAtTime(35, t + dur);
  og.gain.setValueAtTime(big ? 0.9 : 0.7, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(og);
  og.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur);

  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, big ? 1.5 : 3);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = big ? 2200 : 1400;
  const ng = ac.createGain();
  ng.gain.value = big ? 0.7 : 0.5;
  src.connect(lp);
  lp.connect(ng);
  ng.connect(ac.destination);
  src.start(t);
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

// A black concrete wall covers the screen, with the revolver behind it. Click it: each hit punches a hole
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
    b.vx = (dx / d) * rand(40, 220);
    b.vy = (dy / d) * rand(20, 140) - rand(0, 160);
    b.vz = -rand(80, 320);
    b.wx = rand(-3, 3); b.wy = rand(-3, 3); b.wz = rand(-1.5, 1.5);
    b.max = b.life = 2.4;
    b.tone = rand(18, 30);
    b.side = rand(50, 80);
    bodies.push(b);
    if (Math.random() < 0.25) spawnPuffs(c.cx, c.cy, 1, 150);
  };

  // the last hit: cracks run across the whole wall and it crumbles, starting where you clicked
  const breakWall = (x: number, y: number) => {
    if (broken) return;
    broken = true;
    dirty = true;
    const far = Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y));
    const size = Math.max(0.7, Math.min(1.25, Math.min(W, H) / 800));
    const cells = makeCells(x, y, far * 1.25, 70, 1.1, rng(4242 + Math.floor(x * 5 + y * 11)));
    const order: number[] = [], when: number[] = [];
    cells.forEach((c, i) => {
      when.push((c.d / far) * 0.5); // the break spreads outwards from the hit
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
    spawnPuffs(x, y, 8, 300);
    spawnChips(x, y, 12, 1.25);
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
    playThud(last);
    prompt.style.opacity = "0";
    dirty = true;
    if (last) breakWall(x, y);
  };

  const doHit = (x: number, y: number) => {
    if (busy || broken) return;
    busy = true;
    getAudio(); // wake the sound up while the click is still fresh
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
      if (!broken) {
        playThud(true);
        breakWall(W / 2, H / 2);
      }
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
      b.vy += WALL_GRAVITY * dt;
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
        timers.push(window.setTimeout(finish, 1600));
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

      {/* the big message in the middle, in the same font as the wingwang logo (it goes away on the first hit) */}
      <div
        ref={promptRef}
        style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "0 1.5rem", pointerEvents: "none", transition: "opacity .45s ease" }}
      >
        <p
          ref={promptTextRef}
          style={{
            margin: 0, textAlign: "center", fontFamily: '"Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive', fontWeight: 700, lineHeight: 1,
            letterSpacing: "-0.02em", fontSize: "clamp(3.5rem, 12vw, 10rem)", color: WALL_TEXT_COLOR,
          }}
        >
          {WALL_PROMPT}
        </p>
      </div>
    </div>
  );
}

/* ---------- The revolver behind the wall ---------- */

const REVOLVER_HEIGHT = "760vh";            // how much scrolling the whole revolver part takes (more = slower)
const REVOLVER_FACE = 0.14;                 // how much of that scrolling it takes to turn and face you (0.14 = the first 14%)
const REVOLVER_FACE_ANGLE = 12;             // once zoomed in, how far the cylinder stays turned to the side, in degrees (0 = dead on)
const REVOLVER_ZOOM = 0.44;                 // how big the cylinder is once zoomed in (0.44 = its radius is 44% of the screen height)
const REVOLVER_DRAG = 3;                    // dragging the cylinder sideways turns it too: higher = it turns further per drag
const REVOLVER_SPIN = 1;                    // 1 or -1: which way the cylinder turns when you scroll down
const REVOLVER_FLIP = true;                 // true = barrel points left, grip on the right. false = barrel right, grip left
const REVOLVER_YAW = 24;                    // how far it's turned towards you so you can see it's 3D, in degrees (0 = flat side view)
const REVOLVER_TILT = 10;                   // how much you look down on it, in degrees
const REVOLVER_MOUSE = 10;                  // how much it turns to follow the mouse, in degrees (0 = not at all)
const REVOLVER_LINE = BLUE;                 // r,g,b of the gun's lines
const REVOLVER_ROUND_LINE = "255,190,110";  // r,g,b of the cartridges' lines
const REVOLVER_LIT = "255,255,255";         // r,g,b of the cartridge whose info is showing
const REVOLVER_FILL = 0.035;                // how see-through the surfaces are (0 = only lines, higher = more solid)

// where the revolver is and which way it faces. turn = which chamber is lit (0 to 5, in between while turning),
// lit[i] = how lit chamber i is (0 to 1), cx/cy = where it sits on the screen, scale = how big,
// px/py = the point on the model it turns around, gun = how visible the rest of the gun is (1 = fully, 0 = only the cylinder)
type RevolverPose = { turn: number; lit: number[]; gun: number; yaw: number; tilt: number; cx: number; cy: number; scale: number; px: number; py: number };

// mix two "r,g,b" colours: t = 0 gives a, t = 1 gives b
function mixRgb(a: string, b: string, t: number): string {
  const x = a.split(",").map(Number), y = b.split(",").map(Number);
  return x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",");
}

// The revolver is a see-through 3D model made of lines. It's built from simple shapes:
// flat outlines given a thickness (frame, grip, hammer, trigger) and round shapes spun around a line
// (barrel, cylinder, cartridges). Then every point is turned, put in perspective and drawn on a flat canvas.
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

// a flat outline with a thickness: the front from z0, the back at z1, and edges across at the corners
function extrudePts(m: Model, pts: Pt[], corner: boolean[], z0: number, z1: number, col: string) {
  const f = pts.map((p) => ({ x: p.x, y: p.y, z: z0 })), b = pts.map((p) => ({ x: p.x, y: p.y, z: z1 }));
  m.lines.push({ pts: f, closed: true, col, w: 1 }, { pts: b, closed: true, col, w: 1 });
  pts.forEach((_, i) => { if (corner[i]) m.lines.push({ pts: [f[i], b[i]], closed: false, col, w: 0.6 }); });
  m.faces.push({ pts: f, col }, { pts: b, col });
}
function extrude(m: Model, d: string, z0: number, z1: number, col: string) {
  const { pts, corner } = pathPts(d);
  extrudePts(m, pts, corner, z0, z1, col);
}
// a bent bar of a set width that follows a line (trigger, trigger guard), with a thickness
function ribbon(m: Model, d: string, width: number, z0: number, z1: number, col: string) {
  const { pts } = pathPts(d);
  const a: Pt[] = [], b: Pt[] = [];
  pts.forEach((p, i) => {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(p1.y - p0.y), ny = p1.x - p0.x;
    const l = Math.hypot(nx, ny) || 1;
    nx = (nx / l) * width / 2;
    ny = (ny / l) * width / 2;
    a.push({ x: p.x + nx, y: p.y + ny });
    b.push({ x: p.x - nx, y: p.y - ny });
  });
  const outline = [...a, ...b.reverse()];
  extrudePts(m, outline, outline.map((_, i) => i === 0 || i === a.length - 1 || i === a.length || i === outline.length - 1), z0, z1, col);
}
// a round shape spun around a line running left to right at height cy, depth cz.
// prof = [x, radius, draw a ring here?]. view = which way you're looking (so the outline edges can be found)
function lathe(m: Model, prof: [number, number, boolean][], cy: number, cz: number, col: string, view: V3, w = 1) {
  const ring = (x: number, r: number) =>
    Array.from({ length: 64 }, (_, k) => {
      const a = (k / 64) * Math.PI * 2;
      return { x, y: cy + r * Math.sin(a), z: cz + r * Math.cos(a) };
    });
  for (const [x, r, on] of prof) if (on && r > 0) m.lines.push({ pts: ring(x, r), closed: true, col, w });
  // the two edges along the side that make its outline from where you're looking
  const as = Math.atan2(-view.z, view.y);
  const side = (a: number) => prof.map(([x, r]) => ({ x, y: cy + r * Math.sin(a), z: cz + r * Math.cos(a) }));
  const s1 = side(as), s2 = side(as + Math.PI);
  m.lines.push({ pts: s1, closed: false, col, w }, { pts: s2, closed: false, col, w });
  m.faces.push({ pts: [...s1, ...s2.reverse()], col });
}

function buildRevolver(turn: number, lit: number[], gun: number, view: V3): Model {
  const m: Model = { lines: [], faces: [] };
  const G = REVOLVER_LINE, A = REVOLVER_ROUND_LINE;

  // frame, grip, hammer, sights, trigger and guard: flat outlines with a thickness
  extrude(m, "M 322 212 L 340 160 L 612 160 L 622 182 L 622 300 Q 618 345 572 352 L 418 352 Q 395 352 385 335 L 345 285 Z", -24, 24, G);
  extrude(m, "M 335 205 C 305 265 262 370 222 500 Q 210 545 248 550 L 305 550 Q 336 547 340 515 C 350 452 372 392 410 348 L 410 300 Z", -30, 30, G);
  // the outline of the grip panels on each side (lines only)
  const panel = pathPts("M 330 262 C 305 318 276 398 249 494 Q 242 528 266 530 L 300 530 Q 320 528 323 505 C 332 450 350 400 380 355 L 372 300 Z").pts;
  for (const z of [-31, 31]) m.lines.push({ pts: panel.map((p) => ({ x: p.x, y: p.y, z })), closed: true, col: G, w: 0.45 });
  extrude(m, "M 352 205 L 338 160 Q 318 132 282 120 L 272 128 Q 300 145 312 175 L 322 210 Z", -7, 7, G);
  extrude(m, "M 346 160 L 346 150 L 356 150 L 356 156 L 366 156 L 366 150 L 376 150 L 376 160 Z", -8, 8, G);
  extrude(m, "M 918 188 L 950 188 L 950 166 Q 936 166 924 176 Z", -4, 4, G);
  ribbon(m, "M 470 350 Q 480 385 454 412", 9, -5, 5, G);
  ribbon(m, "M 420 350 C 405 420 470 448 520 432 C 560 420 575 385 568 350", 12, -7, 7, G);

  // barrel (with the hole down the middle at the end) and the housing under it
  lathe(m, [[612, 26, true], [958, 26, true], [964, 24, true]], 214, 0, G, view);
  lathe(m, [[958, 8, false], [964, 8, true]], 214, 0, G, view, 0.8);
  lathe(m, [[612, 15, true], [890, 15, true], [905, 4, true]], 253, 0, G, view, 0.8);

  // everything so far is the rest of the gun: it fades away as you zoom in on the cylinder
  for (const l of m.lines) l.w *= gun;
  for (const f of m.faces) f.w = gun;

  // the cylinder: a drum with six chambers, turned by `turn`
  const cy = 256, R = 76, C = 47;
  lathe(m, [[410, R - 6, true], [416, R, true], [592, R, true], [598, R - 6, true]], cy, 0, G, view);
  lathe(m, [[398, 9, true], [612, 9, true]], cy, 0, G, view, 0.6); // the pin it turns on
  // the lit chamber sits on the side of the drum nearest the info (on the left of the screen once it faces you)
  const base = REVOLVER_FLIP ? 0 : Math.PI;
  for (let i = 0; i < 6; i++) {
    const a = base + ((i - turn) * REVOLVER_SPIN * Math.PI) / 3, ry = cy + C * Math.sin(a), rz = C * Math.cos(a);
    // the grooves on the outside, between the chambers
    const g = a + Math.PI / 6;
    m.lines.push({ pts: [450, 560].map((x) => ({ x, y: cy + R * Math.sin(g), z: R * Math.cos(g) })), closed: false, col: G, w: 0.45 });
    // the chamber holes on the front and back of the drum
    for (const x of [410, 598]) {
      m.lines.push({
        pts: Array.from({ length: 40 }, (_, k) => {
          const b = (k / 40) * Math.PI * 2;
          return { x, y: ry + 18 * Math.sin(b), z: rz + 18 * Math.cos(b) };
        }),
        closed: true, col: mixRgb(G, REVOLVER_LIT, lit[i]), w: 0.7 + 0.5 * lit[i],
      });
    }
    // the cartridge in the chamber: the rim, the brass case, then the bullet
    lathe(m, [[408, 17, true], [414, 17, false], [414, 15, true], [528, 15, true], [544, 13, false], [556, 9, false], [566, 3, false]], ry, rz, mixRgb(A, REVOLVER_LIT, lit[i]), view, 0.9 + 0.6 * lit[i]);
  }
  return m;
}

// draw the model in a pose (yaw/tilt in radians)
function drawRevolver(ctx: CanvasRenderingContext2D, W: number, H: number, o: RevolverPose) {
  const fl = REVOLVER_FLIP ? -1 : 1;
  const cY = Math.cos(o.yaw), sY = Math.sin(o.yaw), cT = Math.cos(o.tilt), sT = Math.sin(o.tilt);
  // which way you're looking, in the model's own directions
  const view = { x: -sY * cT * fl, y: sT, z: cY * cT };
  const m = buildRevolver(o.turn, o.lit, o.gun, view);

  const s = o.scale, F = 1600;
  const proj = (p: V3) => {
    const X = (p.x - o.px) * fl, Y = p.y - o.py, Z = p.z;
    const x1 = X * cY + Z * sY, z1 = -X * sY + Z * cY;
    const y2 = Y * cT - z1 * sT, z2 = Y * sT + z1 * cT;
    const k = F / (F + z2);
    return { x: o.cx + x1 * s * k, y: o.cy + y2 * s * k, z: z2 };
  };

  ctx.save();
  // a faint glow behind it
  const glow = ctx.createRadialGradient(o.cx, o.cy, 0, o.cx, o.cy, Math.max(W, H) * 0.42);
  glow.addColorStop(0, `rgba(${BLUE},.07)`);
  glow.addColorStop(1, `rgba(${BLUE},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  // everything adds light on top of what's under it, so overlapping see-through parts glow a little more
  ctx.globalCompositeOperation = "lighter";

  if (REVOLVER_FILL > 0) {
    for (const f of m.faces) {
      const fw = f.w ?? 1;
      if (fw < 0.01) continue;
      ctx.fillStyle = `rgba(${f.col},${(REVOLVER_FILL * fw).toFixed(4)})`;
      ctx.beginPath();
      f.pts.forEach((p, i) => { const q = proj(p); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
      ctx.closePath();
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
      const near = Math.min(1, Math.max(0, 0.5 - (a.z + b.z) / 2 / 460));
      const lv = Math.min(LEVELS - 1, Math.floor(near * LEVELS));
      const key = `${l.col}|${lv}|${l.w}`;
      let g = groups.get(key);
      if (!g) {
        g = { col: l.col, a: (0.2 + 0.8 * (lv + 0.5) / LEVELS) * l.w, path: new Path2D() };
        groups.set(key, g);
      }
      g.path.moveTo(a.x, a.y);
      g.path.lineTo(b.x, b.y);
    }
  }
  ctx.lineCap = "round";
  for (const g of groups.values()) {
    ctx.strokeStyle = `rgba(${g.col},${(g.a * 0.12).toFixed(3)})`; // soft glow
    ctx.lineWidth = 4;
    ctx.stroke(g.path);
    ctx.strokeStyle = `rgba(${g.col},${Math.min(1, g.a).toFixed(3)})`;
    ctx.lineWidth = 1.1;
    ctx.stroke(g.path);
  }
  ctx.restore();
}

/* ---------- Page ---------- */

export default function Home() {
  // Put your picture at public/ethan.jpg. If it's missing, the placeholder shows.
  const [photoOk, setPhotoOk] = useState(true);

  const aboutTitleRef = useRef<HTMLHeadingElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const revRef = useRef<HTMLElement>(null);
  const revCanvasRef = useRef<HTMLCanvasElement>(null);
  const revHintRef = useRef<HTMLDivElement>(null);
  const revDragRef = useRef<HTMLDivElement>(null);
  const panelEls = useRef<(HTMLDivElement | null)[]>([]); // the info for each chamber

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

  // The revolver. As you scroll: first it turns to point at you and the camera zooms in until only the
  // cylinder is left (the rest of the gun fades away). Then the cylinder glides round and settles on one
  // chamber at a time; the lit chamber's info shows next to it. You can also drag the cylinder sideways.
  // It leans a little towards the mouse and sways gently, so you can see it's 3D.
  useEffect(() => {
    const box = revRef.current, cv = revCanvasRef.current, hint = revHintRef.current, drag = revDragRef.current;
    const c = cv?.getContext("2d");
    if (!box || !cv || !c) return;
    let raf = 0, last = performance.now(), ps = 0, w = 0, h = 0, dpr = 1, tv = 0;
    let mx = 0, my = 0, ex = 0, ey = 0;
    let dragging = false, lastX = 0;
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
      if (dragging) {
        // dragging left moves on to the next chamber (it scrolls the page for you)
        const d = (lastX - e.clientX) * REVOLVER_DRAG;
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
    cv.addEventListener("pointerdown", onDown);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const deg = Math.PI / 180;
    const fl = REVOLVER_FLIP ? -1 : 1;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const br = box.getBoundingClientRect();
      const p = clamp((NAVBAR - br.top) / Math.max(1, br.height - h), 0, 1);
      ps += (p - ps) * (1 - Math.exp(-dt * 9)); // smooth out the scrolling
      ex += (mx - ex) * (1 - Math.exp(-dt * 3));
      ey += (my - ey) * (1 - Math.exp(-dt * 3));

      const A = REVOLVER_FACE;
      const f = smooth(0, A, ps); // 0 = the whole gun side on, 1 = zoomed in on the cylinder
      // after that, the scrolling is split into six: one stop per chamber
      const u = clamp((ps - A) / (1 - A), 0, 1) * 6;
      const k = Math.min(5, Math.floor(u));
      const target = Math.min(5, k + smooth(0.6, 1, u - k));
      tv += (target - tv) * (1 - Math.exp(-dt * 6)); // glides after the scroll and settles softly on each chamber
      const shown = smooth(A * 0.8, A, ps);
      const lit = [0, 1, 2, 3, 4, 5].map((i) => (1 - clamp(Math.abs(tv - i) * 2, 0, 1)) * shown);

      if (br.bottom > 0 && br.top < window.innerHeight) {
        const small = w < 768; // phones: the cylinder sits at the top and the info goes underneath
        const sSide = Math.min((w * 0.8) / 800, (h * 0.7) / 450);
        const radius = small ? Math.min(w * 0.36, h * 0.2) : Math.min(h * REVOLVER_ZOOM, w * 0.3);
        const z = f * f; // the zoom speeds up towards the end, like a camera pushing in
        const t = now / 1000;
        const wob = 1 - f * 0.6; // it moves about a bit less once zoomed in
        drawPose(c, {
          turn: tv, lit,
          gun: 1 - smooth(0.45, 0.9, f),
          yaw: (lerp(REVOLVER_YAW, fl * (90 - REVOLVER_FACE_ANGLE), f) + (ex * REVOLVER_MOUSE + Math.sin(t * 0.6) * 2) * wob) * deg,
          tilt: (lerp(REVOLVER_TILT, 4, f) + (ey * REVOLVER_MOUSE * 0.5 + Math.sin(t * 0.45)) * wob) * deg,
          cx: lerp(w / 2, small ? w / 2 : w * 0.66, f),
          cy: lerp(h / 2, small ? h * 0.25 : h * 0.5, f),
          scale: lerp(sSide, radius / 80, z),
          px: lerp(590, 560, f),
          py: lerp(335, 256, f),
        });
      }
      // the info for each chamber fades in while its chamber is lit
      panelEls.current.forEach((el, i) => {
        if (!el) return;
        const v = lit[i];
        el.style.opacity = String(v);
        el.style.transform = `translate3d(0,${((1 - v) * 24).toFixed(1)}px,0)`;
        el.style.visibility = v < 0.01 ? "hidden" : "visible";
        el.style.pointerEvents = v > 0.6 ? "auto" : "none";
      });
      if (hint) hint.style.opacity = String(1 - smooth(0, 0.03, ps));
      if (drag) drag.style.opacity = String(shown * (1 - smooth(0.97, 1, ps)));
      raf = requestAnimationFrame(frame);
    };
    const drawPose = (cc: CanvasRenderingContext2D, pose: RevolverPose) => {
      cc.setTransform(dpr, 0, 0, dpr, 0, 0);
      cc.clearRect(0, 0, w, h);
      drawRevolver(cc, w, h, pose);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointerdown", onDown);
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
      {/* blue glow bleeding in from the side (fixed, so it stays put while you scroll) */}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{ position: "fixed", left: 0, right: 0, bottom: 0, top: NAVBAR, background: SIDE_GLOW }}
      />

      {/* the page's main heading: screen readers and Google read it, it isn't shown */}
      <h1 className="sr-only">Ethan Wang: photography, and a bit about me</h1>

      {/* the wall (only when you first arrive) */}
      {introOn && <WallIntro onBreak={() => setPhase("breaking")} onDone={() => setPhase("none")} />}

      {/* dot + trailing ring cursor (it shows on the wall too) */}
      <Cursor />

      <style>{PAGE_CSS + INTRO_CSS + LENIS_CSS + CURSOR_CSS + CONTACT_CSS + BG_CSS + WALL_CSS}</style>

      {/* The revolver behind the wall. Scrolling through this tall block zooms in on its cylinder, then turns the
          cylinder round one chamber at a time. Each chamber holds some info (edit ABOUT_TITLE, ABOUT_TEXT and CHAMBERS at the top). */}
      <section ref={revRef} className="relative" style={{ height: REVOLVER_HEIGHT }}>
        <div className="sticky top-16 h-[calc(100dvh-4rem)] w-full overflow-hidden">
          <canvas ref={revCanvasRef} role="img" aria-label="A see-through 3D revolver" className="absolute inset-0 h-full w-full" />

          {/* the info in each chamber: to the left of the cylinder (underneath it on phones) */}
          <div className="pointer-events-none absolute inset-x-6 bottom-6 top-[50%] md:inset-y-0 md:left-[6%] md:right-auto md:w-[32%]">
            {/* chamber 1: who am i? */}
            <div
              ref={(el) => { panelEls.current[0] = el; }}
              className="absolute inset-0 flex items-start md:items-center"
              style={{ opacity: 0, visibility: "hidden" }}
            >
              <div className="w-full">
                {/* your photo in a vintage polaroid (on bigger screens) */}
                <div className="mb-8 hidden w-full max-w-[10rem] md:block">
                  <div className="polaroid">
                    <div className="polaroid-window">
                      {photoOk ? (
                        <Image
                          src="/ethan.jpg"
                          alt="Photo of me"
                          fill
                          sizes="10rem"
                          className="object-cover"
                          onError={() => setPhotoOk(false)}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-neutral-500">
                          <p className="text-sm">
                            Add your photo at <code>public/ethan.jpg</code>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-4 text-xs uppercase tracking-[0.3em]" style={{ color: `rgb(${BLUE})` }}>01 / 06</p>
                  <h2
                    ref={aboutTitleRef}
                    aria-label={ABOUT_TITLE}
                    className="text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl"
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
                  <div className="mt-6 space-y-4 text-base leading-relaxed text-neutral-400 sm:text-xl">
                    {ABOUT_TEXT.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* chambers 2 to 6 */}
            {CHAMBERS.slice(0, 5).map((ch, i) => (
              <div
                key={i}
                ref={(el) => { panelEls.current[i + 1] = el; }}
                className="absolute inset-0 flex items-start md:items-center"
                style={{ opacity: 0, visibility: "hidden" }}
              >
                <div className="max-w-xl">
                  <p className="mb-4 text-xs uppercase tracking-[0.3em]" style={{ color: `rgb(${BLUE})` }}>
                    {String(i + 2).padStart(2, "0")} / 06
                  </p>
                  <h2 className="text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">{ch.title}</h2>
                  <p className="mt-6 text-base leading-relaxed text-neutral-400 sm:text-xl">{ch.text}</p>
                  {ch.link && (
                    <div className="mt-8">
                      {ch.link.href.startsWith("http") ? (
                        <a href={ch.link.href} target="_blank" rel="noopener noreferrer" className="contact-btn">
                          {ch.link.label}
                          <ArrowUpRight />
                        </a>
                      ) : (
                        <Link href={ch.link.href} className="contact-btn">
                          {ch.link.label}
                          <ArrowUpRight />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* like a carousel: you can drag the cylinder round too */}
          <div ref={revDragRef} className="pointer-events-none absolute bottom-8 left-[6%] hidden text-xs uppercase tracking-[0.3em] text-neutral-500 md:block" style={{ opacity: 0 }}>
            drag / scroll
          </div>

          <div ref={revHintRef} className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-xs uppercase tracking-[0.3em] text-neutral-400">
            scroll
            <span className="sc-hint block h-10 w-px bg-white/60" />
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 px-6 pb-6 pt-2 text-xs text-neutral-500">
        <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className="contact-btn">
          Résumé
          <ArrowUpRight />
        </a>
        <Link href="/contact" className="contact-btn">
          Contact me
          <ArrowUpRight />
        </Link>
        <span>© 2026 Ethan Wang. All rights reserved.</span>
      </footer>
    </main>
  );
}