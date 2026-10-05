"use client";
// app/page.tsx  (everything for the home page lives in this one file)

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import Lenis from "lenis";

// TODO: your email for the "Contact me" button
const EMAIL = "ethan@wingwang.ca";

const GLASS_CSS = `
.glass-tile {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.25rem;
  border-radius: 2rem;
  overflow: hidden;
  color: #fff;
  text-decoration: none;
  background: linear-gradient(145deg, rgba(255,255,255,.2), rgba(255,255,255,.05));
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid rgba(255,255,255,.18);
  box-shadow:
    inset 0 1px 1px rgba(255,255,255,.55),
    inset 0 -1px 1px rgba(255,255,255,.1),
    inset 0 0 30px rgba(255,255,255,.05),
    0 24px 60px -12px rgba(0,0,0,.7);
  transition: transform .6s cubic-bezier(.34,1.56,.64,1), box-shadow .5s ease;
  animation: glass-in .9s cubic-bezier(.34,1.56,.64,1) backwards;
}

/* light that follows the cursor */
.glass-tile::before {
  content: "";
  position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background: radial-gradient(circle at var(--mx, 25%) var(--my, 0%), rgba(255,255,255,.35), transparent 55%);
  opacity: .55;
  transition: opacity .4s ease;
}
/* sheen that sweeps across on hover */
.glass-tile::after {
  content: "";
  position: absolute; top: 0; bottom: 0; left: 0; width: 50%; z-index: -1; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
  transform: translateX(-150%) skewX(-20deg);
  transition: transform 1s cubic-bezier(.22,1,.36,1);
}

.glass-tile:hover, .glass-tile:focus-visible {
  transform: translateY(-4px) scale(1.02);
  outline: none;
  box-shadow:
    inset 0 1px 1px rgba(255,255,255,.7),
    inset 0 -1px 1px rgba(255,255,255,.15),
    inset 0 0 40px rgba(255,255,255,.08),
    0 0 0 1px rgba(255,255,255,.3),
    0 30px 80px -10px rgba(255,255,255,.14),
    0 30px 60px -12px rgba(0,0,0,.8);
}
.glass-tile:hover::before, .glass-tile:focus-visible::before { opacity: 1; }
.glass-tile:hover::after, .glass-tile:focus-visible::after { transform: translateX(300%) skewX(-20deg); }
.glass-tile:active { transform: scale(.97); }

.glass-icon {
  position: absolute; top: 1.25rem; left: 1.25rem;
  width: 3rem; height: 3rem;
  display: grid; place-items: center;
  border-radius: 9999px;
  background: rgba(255,255,255,.12);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.4), inset 0 0 0 1px rgba(255,255,255,.12);
  transition: transform .6s cubic-bezier(.34,1.56,.64,1);
}
.glass-tile:hover .glass-icon, .glass-tile:focus-visible .glass-icon { transform: scale(1.15) rotate(-8deg); }

.glass-title { display: block; font-size: 1.45rem; font-weight: 700; letter-spacing: -.01em; line-height: 1.1; }
.glass-desc { display: block; margin-top: .3rem; font-size: 1.05rem; line-height: 1.25; color: rgba(255,255,255,.65); }
@media (min-width: 640px) {
  .glass-title { font-size: 1.8rem; }
  .glass-desc { font-size: 1.2rem; }
}

/* wide variant: icon on the left, text beside it (used for the stacked Photos / Videos rectangles) */
.glass-wide { flex-direction: row; align-items: center; justify-content: flex-start; gap: 1.25rem; padding: .75rem 1.5rem; }
.glass-wide .glass-icon { position: static; flex-shrink: 0; order: 2; } /* order: 2 puts the icon after the text, on the right */
.glass-wide .glass-text { flex: 1; }

/* images that pop out from behind a rectangle on hover */
.glass-wrap { position: relative; }
.glass-wrap > .glass-tile { position: relative; z-index: 1; height: 100%; width: 100%; }
.pop { position: absolute; left: 0; right: 0; height: 0; z-index: 0; pointer-events: none; }
/* the clip hides everything on the tile's side of the edge, so the photos really do come out from behind it */
.pop-up   { top: 0;     clip-path: inset(-400px -80px 0 -80px); }
.pop-down { bottom: 6px; clip-path: inset(0 -80px -400px -80px); }
.pop-img {
  position: absolute; left: var(--px); width: clamp(6rem, 24%, 9rem); aspect-ratio: 4 / 3;
  border-radius: .9rem; overflow: hidden; background: #171717;
  border: 1px solid rgba(255,255,255,.25); box-shadow: 0 14px 34px -10px rgba(0,0,0,.85);
  opacity: 0;
  transition: transform .6s cubic-bezier(.34,1.56,.64,1) var(--pd, 0ms), opacity .3s ease var(--pd, 0ms);
}
.pop-up .pop-img   { bottom: 0; transform: translateY(115%) rotate(0deg) scale(.8); }
.pop-down .pop-img { top: 0;    transform: translateY(-115%) rotate(0deg) scale(.8); }
.glass-wrap:hover .pop-img, .glass-wrap:focus-within .pop-img { opacity: 1; }
.glass-wrap:hover .pop-up .pop-img, .glass-wrap:focus-within .pop-up .pop-img { transform: translateY(32%) rotate(var(--r, 0deg)); }
.glass-wrap:hover .pop-down .pop-img, .glass-wrap:focus-within .pop-down .pop-img { transform: translateY(-32%) rotate(var(--r, 0deg)); }

@keyframes glass-in { from { opacity: 0; transform: translateY(40px) scale(.9); } }

@media (prefers-reduced-motion: reduce) {
  .glass-tile, .glass-icon, .glass-tile::after { animation: none; transition-duration: .01s; }
  .pop-img { transition-duration: .01s; }
}
`;

const PAGE_CSS = `
@keyframes hl-rise { from { opacity: 0; transform: translateY(.7em); filter: blur(10px); } }
@keyframes hl-line { from { transform: scaleX(0); } }
@keyframes hl-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(40px, -30px) scale(1.12); }
}
@keyframes hl-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes hl-photo-in { from { opacity: 0; transform: scale(.92) translateY(24px); } }

.hl-word  { display: inline-block; animation: hl-rise .9s cubic-bezier(.22,1,.36,1) backwards; animation-delay: calc(var(--i) * 90ms + 500ms); }
.hl-line  { transform-origin: left; animation: hl-line 1.2s cubic-bezier(.22,1,.36,1) 1.1s backwards; }
.hl-blob  { animation: hl-drift 14s ease-in-out infinite; }
.hl-float { animation: hl-float 6s ease-in-out infinite; }
.hl-photo { animation: hl-photo-in .9s cubic-bezier(.34,1.56,.64,1) backwards; }

/* the photo's frame: just spacing, the scroll line draws the outline around it */
.hl-frame {
  position: relative;
  border-radius: 2.25rem;
  padding: .5rem;
}

@media (prefers-reduced-motion: reduce) {
  .hl-word, .hl-line, .hl-blob, .hl-float, .hl-photo { animation: none; }
}
`;

// ---- tweak these (smooth scrolling) ----
const LENIS_LERP = 0.12;  // higher = snappier, the page catches up to your scrolling faster; lower = floatier glide (try 0.06 to 0.2)
const LENIS_WHEEL = 2.4;  // higher = each flick of the wheel or trackpad travels further (1 = normal)

// what Lenis needs so the browser doesn't fight its smooth scrolling
const LENIS_CSS = `
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-smooth iframe { pointer-events: none; }
`;

const INTRO_CSS = `
/* the photo + buttons section waits (paused at its first frame) until it scrolls into view */
.hl-head { animation: hl-rise .9s cubic-bezier(.22,1,.36,1) .2s backwards; }
.rv .hl-photo, .rv .glass-tile, .rv .hl-head { animation-play-state: paused; }
.rv.rv-in .hl-photo, .rv.rv-in .glass-tile, .rv.rv-in .hl-head { animation-play-state: running; }

@keyframes sc-hint { 0% { transform: scaleY(0); transform-origin: top; } 50% { transform: scaleY(1); transform-origin: top; } 51% { transform-origin: bottom; } 100% { transform: scaleY(0); transform-origin: bottom; } }
.sc-hint { animation: sc-hint 2.2s cubic-bezier(.65,0,.35,1) infinite; }
.ig-in { animation: hl-rise 1.1s cubic-bezier(.22,1,.36,1) .25s backwards; }
@media (prefers-reduced-motion: reduce) { .sc-hint, .ig-in, .hl-head { animation: none; } }
`;

/* ---------- Liquid glass tile ---------- */

type TileProps = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  wide?: boolean;
  className?: string; // sizing for the whole thing (e.g. its height)
  delay?: number; // ms, for the staggered entrance
  pics?: string[]; // images that pop out from behind it on hover
  dir?: "up" | "down"; // which side they pop out of
};

// where the (up to) three popped-out images sit along the rectangle, and how much each is tilted
const POP_SPOTS = [
  { x: "28%", r: "-8deg" },
  { x: "50%", r: "3deg" },
  { x: "70%", r: "9deg" },
];

function GlassTile({ href, title, description, icon, wide, className = "", delay = 0, pics = [], dir = "up" }: TileProps) {
  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const onLeave = (e: PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.removeProperty("--mx");
    e.currentTarget.style.removeProperty("--my");
  };

  return (
    <div className={`glass-wrap ${className}`}>
      {pics.length > 0 && (
        <div className={`pop pop-${dir}`} aria-hidden="true">
          {pics.slice(0, 3).map((src, i) => (
            <span
              key={src}
              className="pop-img"
              style={{ "--px": POP_SPOTS[i].x, "--r": POP_SPOTS[i].r, "--pd": `${i * 70}ms` } as CSSProperties}
            >
              <Image src={src} alt="" fill sizes="160px" draggable={false} className="object-cover" />
            </span>
          ))}
        </div>
      )}
      <Link
        href={href}
        className={`glass-tile ${wide ? "glass-wide" : ""}`}
        style={{ animationDelay: `${delay}ms` }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <span className="glass-icon" aria-hidden="true">{icon}</span>
        <span className="glass-text">
          <span className="glass-title">{title}</span>
          <span className="glass-desc">{description}</span>
        </span>
      </Link>
    </div>
  );
}

/* ---------- Icons ---------- */

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-7 w-7",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PhotoIcon = (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.75" />
    <path d="M21 16l-5-5-8 9" />
  </svg>
);
const VideoIcon = (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M10 9l5 3-5 3z" fill="currentColor" />
  </svg>
);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// ---- tweak these ----
const NAVBAR = 64;            // navbar height in px (h-16)
const INTRO_HEIGHT = "420vh"; // how much scrolling the three lines take

// Each line fades in over `in` and out over `out`. The numbers are how far through the intro you've
// scrolled (0 = top, 1 = end), so the lines overlap a little as they swap.
const BEATS = [
  { in: [-1, 0], out: [0.2, 0.32] },    // hi
  { in: [0.28, 0.4], out: [0.58, 0.7] }, // my names ethan
  { in: [0.66, 0.78], out: [0.93, 0.995] }, // im a student tryna do something
] as const;

/* ---------- Scroll line ----------
   A grey line that draws itself as you scroll (like lusion.co).
   It stays hidden on the home screen, sweeps in from the left edge when you scroll, swings left and
   right down the page, thins out as it nears your photo, and becomes the photo's border: it splits at
   the top of the photo and draws the outline around it in both directions, lighting up (grey to
   glowing white) as it touches.
   The tip eases after your scrolling, so it keeps gliding a moment after you stop. */

// ---- tweak these ----
const LINE_GRAY = 150;            // how light the grey line is (0 = black, 255 = white). The frame outline starts this grey and lights up to white
const LINE_COLOR = `${LINE_GRAY},${LINE_GRAY},${LINE_GRAY}`; // r,g,b of the line
const LINE_OPACITY = 1;           // 1 = solid
const LINE_HEAD = 0.8;            // where the tip sits in the window (0 = top, 1 = bottom). Higher = the line reaches the photo sooner
const LINE_SWING = 0.34;          // how far it swings left/right, as a share of page width
const LINE_MAX_SWING = 420;       // ...but never more than this many px
const LINE_WAVE = 1.1;            // height of one left/right swing, as a share of the window height
const LINE_SMOOTH = 4.5;          // higher = the tip catches up with your scrolling faster
const LINE_ENTRY = 0.9;           // height of the first sweep in from the left, as a share of the window height
const LINE_TAPER = 1.2;           // how far before the photo the line starts thinning (share of window height)
const FRAME_W = 2.5;              // thickness of the frame outline (the line thins down to this)
const FRAME_DRAW = 0.3;           // how much scrolling (share of window height) the outline takes to draw around the photo

type LineBuilt = {
  xs: number[];
  ys: number[];
  vy: number[];  // y at each point, used to match scrolling to the line
  cum: number[]; // length of the line up to each point
  total: number;
  hw: number[];  // half the line's thickness at each point
  lx: number[]; ly: number[]; // left edge of the line at each point
  rx: number[]; ry: number[]; // right edge
  ls: string[]; rs: string[]; // the same edges as text, ready for the path
};

// Build the whole line as lots of tiny steps (so it looks perfectly smooth), then give it a
// thickness that thins out towards the end.
//   y0 = where it starts (off the left edge), fx / yF = where it ends (top-centre of the photo frame)
function buildLine(W: number, vh: number, y0: number, fx: number, yF: number, pad: number, stroke: number): LineBuilt {
  const cx = W / 2;
  const A = Math.min(W * LINE_SWING, LINE_MAX_SWING);
  const L = clamp(vh * LINE_ENTRY, 450, 800);
  const y1 = y0 + L;
  const end = Math.max(yF, y1 + 300);

  const xs: number[] = [-pad];
  const ys: number[] = [y0];

  // 1) sweep in from the left edge and turn down into the middle
  const steps1 = Math.max(60, Math.ceil(L / 3));
  const P1x = cx * 0.85, P1y = y0 + L * 0.3, P2y = y1 - L * 0.35;
  for (let s = 1; s <= steps1; s++) {
    const t = s / steps1, m = 1 - t;
    xs.push(-pad * (m * m * m) + P1x * (3 * m * m * t) + cx * (3 * m * t * t + t * t * t));
    ys.push(y0 * (m * m * m) + P1y * (3 * m * m * t) + P2y * (3 * m * t * t) + y1 * (t * t * t));
  }

  // 2) swings down the page, ending right at the photo frame. S-curves that are vertical at both
  //    ends, so they join without kinks.
  const n = Math.max(2, Math.round((end - y1) / clamp(vh * LINE_WAVE, 480, 900)));
  const h = (end - y1) / n;
  const base = fx < cx ? 1 : -1; // the swing just before the frame is on the opposite side to it
  let px = cx, py = y1;
  for (let i = 1; i <= n; i++) {
    const nx = i === n ? fx : cx + A * base * ((n - 1 - i) % 2 === 0 ? 1 : -1);
    const ny = y1 + h * i;
    const steps = Math.max(8, Math.ceil(h / 4));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps, m = 1 - t;
      xs.push(px * (m * m * m + 3 * m * m * t) + nx * (3 * m * t * t + t * t * t));
      ys.push(
        m * m * m * py + 3 * m * m * t * (py + h / 2) + 3 * m * t * t * (ny - h / 2) + t * t * t * ny,
      );
    }
    px = nx;
    py = ny;
  }

  const cum = [0];
  for (let i = 1; i < xs.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]));
  }
  const total = cum[cum.length - 1];
  const last = xs.length - 1;

  // 3) thickness: full width, then thinning down to the frame's thickness over the last stretch
  const taper = vh * LINE_TAPER;
  const hw: number[] = [], lx: number[] = [], ly: number[] = [], rx: number[] = [], ry: number[] = [];
  const ls: string[] = [], rs: string[] = [];
  for (let i = 0; i <= last; i++) {
    const t = clamp((total - cum[i]) / taper, 0, 1);
    const s = t * t * (3 - 2 * t);
    const half = 0.5 * (FRAME_W + (stroke - FRAME_W) * s);
    const i0 = Math.max(0, i - 1), i1 = Math.min(last, i + 1);
    const tx = xs[i1] - xs[i0], ty = ys[i1] - ys[i0];
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len, ny = tx / len;
    hw.push(half);
    lx.push(xs[i] + nx * half); ly.push(ys[i] + ny * half);
    rx.push(xs[i] - nx * half); ry.push(ys[i] - ny * half);
    ls.push(`${lx[i].toFixed(1)} ${ly[i].toFixed(1)}`);
    rs.push(`${rx[i].toFixed(1)} ${ry[i].toFixed(1)}`);
  }
  return { xs, ys, vy: ys, cum, total, hw, lx, ly, rx, ry, ls, rs };
}

// the outline around the photo, as two halves that both start at the top-centre
function frameOutline(w: number, h: number, r0: number) {
  const r = Math.min(r0, w / 2, h / 2);
  const c = w / 2;
  return {
    cw: `M${c} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H${c}`,
    ccw: `M${c} 0H${r}A${r} ${r} 0 0 0 0 ${r}V${h - r}A${r} ${r} 0 0 0 ${r} ${h}H${c}`,
  };
}

function ScrollLine() {
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const polyRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const svg = svgRef.current, group = groupRef.current, poly = polyRef.current, tip = tipRef.current;
    if (!svg || !group || !poly || !tip) return;
    const host = svg.parentElement; // the <main>
    if (!host) return;

    // the photo frame and its outline (they live inside the page, see the JSX in Home)
    const frameEl = host.querySelector<HTMLElement>("[data-line-target]");
    const outSvg = host.querySelector<SVGSVGElement>("[data-frame-svg]");
    const outCw = host.querySelector<SVGPathElement>("[data-frame-cw]");
    const outCcw = host.querySelector<SVGPathElement>("[data-frame-ccw]");

    const st = { b: null as LineBuilt | null };
    let lastW = 0, lastH = 0, lastVh = 0, lastFx = -1, lastFy = -1, lastFw = -1, lastFh = -1;
    let lastFi = -1, lastGlow = -1;
    let raf = 0, last = performance.now(), cur = -1;

    // where the photo frame is, measured from layout (ignores its entrance animation)
    const locate = () => {
      const el = frameEl;
      if (!el) return null;
      let x = 0, y = 0;
      let node: HTMLElement | null = el;
      while (node && node !== host) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      if (node !== host) return null;
      return { fx: x + el.offsetWidth / 2, fy: y, fw: el.offsetWidth, fh: el.offsetHeight };
    };

    // (re)build the line whenever the page size or the frame changes
    const rebuild = (w: number, h: number, vh: number, fx: number, fy: number, fw: number, fh: number) => {
      lastW = w; lastH = h; lastVh = vh; lastFx = fx; lastFy = fy; lastFw = fw; lastFh = fh;
      lastFi = -1;
      const stroke = clamp(w * 0.017, 10, 24);
      // the tip sits at `vh * LINE_HEAD` on screen when you haven't scrolled, so start exactly there:
      // nothing shows until the first scroll
      const pageTop = host.getBoundingClientRect().top + window.scrollY;
      const y0 = vh * LINE_HEAD - pageTop;
      st.b = buildLine(w, vh, y0, fx, fy, stroke * 3, stroke);

      if (frameEl && outCw && outCcw && fw > 0 && fh > 0) {
        const radius = parseFloat(getComputedStyle(frameEl).borderTopLeftRadius) || 36;
        const o = frameOutline(fw, fh, radius);
        outCw.setAttribute("d", o.cw);
        outCcw.setAttribute("d", o.ccw);
      }
    };

    // draw the line up to point `fi` (can be a fraction), as a ribbon that gets thinner towards the end
    const paint = (b: LineBuilt, fi: number) => {
      const i = clamp(Math.floor(fi), 0, b.xs.length - 2);
      const t = clamp(fi - i, 0, 1);
      const lerp = (arr: number[]) => arr[i] + (arr[i + 1] - arr[i]) * t;

      const parts: string[] = ["M" + b.ls[0]];
      for (let j = 1; j <= i; j++) parts.push("L" + b.ls[j]);
      parts.push(`L${lerp(b.lx).toFixed(1)} ${lerp(b.ly).toFixed(1)}`);
      parts.push(`L${lerp(b.rx).toFixed(1)} ${lerp(b.ry).toFixed(1)}`);
      for (let j = i; j >= 0; j--) parts.push("L" + b.rs[j]);
      parts.push("Z");
      poly.setAttribute("d", parts.join(""));

      // round tip
      tip.setAttribute("cx", lerp(b.xs).toFixed(1));
      tip.setAttribute("cy", lerp(b.ys).toFixed(1));
      tip.setAttribute("r", lerp(b.hw).toFixed(2));

      const show = fi > 0.5 ? "1" : "0";
      poly.style.opacity = show;
      tip.style.opacity = show;
    };

    // turn "how far down the page the tip is" into a position along the line
    const indexAt = (b: LineBuilt, headY: number) => {
      const ys = b.vy;
      const lastI = ys.length - 1;
      if (headY <= ys[0]) return 0;
      if (headY >= ys[lastI]) return lastI;
      let lo = 0, hi = lastI;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] <= headY) lo = mid; else hi = mid;
      }
      return lo + (headY - ys[lo]) / Math.max(0.0001, ys[hi] - ys[lo]);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = host.clientWidth;
      const h = host.offsetHeight;
      const vh = window.innerHeight;
      const f = locate() ?? { fx: w * 0.3, fy: h * 0.8, fw: 0, fh: 0 };

      if (
        w > 10 && h > 10 &&
        (!st.b || w !== lastW || Math.abs(h - lastH) > 2 || Math.abs(vh - lastVh) > 150 ||
          Math.abs(f.fx - lastFx) > 2 || Math.abs(f.fy - lastFy) > 2 ||
          Math.abs(f.fw - lastFw) > 2 || Math.abs(f.fh - lastFh) > 2)
      ) {
        rebuild(w, h, vh, f.fx, f.fy, f.fw, f.fh);
      }

      const b = st.b;
      if (b) {
        // the line lives in page coordinates; slide it up as the page scrolls
        const top = host.getBoundingClientRect().top;
        group.setAttribute("transform", `translate(0 ${(top - NAVBAR).toFixed(1)})`);

        const target = -top + vh * LINE_HEAD;
        cur = cur < 0 ? target : cur + (target - cur) * (1 - Math.exp(-dt * LINE_SMOOTH));

        const fi = indexAt(b, cur);
        if (Math.abs(fi - lastFi) > 0.02) {
          lastFi = fi;
          paint(b, fi);
        }

        // once the line touches the photo, the outline draws around it from the touch point and lights up
        if (outCw && outCcw && outSvg) {
          const headMax = lastH - vh * (1 - LINE_HEAD); // lowest the tip can ever get
          const dist = Math.min(vh * FRAME_DRAW, Math.max(60, headMax - lastFy) * 0.7);
          const p = clamp((cur - lastFy) / dist, 0, 1);
          const g = p * p * (3 - 2 * p);
          const dash = `${g.toFixed(4)} 2`;
          const vis = g > 0.002 ? "1" : "0";
          outCw.style.strokeDasharray = dash;
          outCcw.style.strokeDasharray = dash;
          outCw.style.opacity = vis;
          outCcw.style.opacity = vis;

          const glow = smooth(lastFy - 40, lastFy + 140, cur);
          if (Math.abs(glow - lastGlow) > 0.01) {
            lastGlow = glow;
            const c = Math.round(LINE_GRAY + glow * (255 - LINE_GRAY));
            outCw.style.stroke = `rgb(${c},${c},${c})`;
            outCcw.style.stroke = `rgb(${c},${c},${c})`;
            outSvg.style.filter =
              glow > 0.01
                ? `drop-shadow(0 0 ${(2 + glow * 10).toFixed(1)}px rgba(255,255,255,${(0.25 + glow * 0.65).toFixed(2)}))`
                : "none";
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // A fixed window-sized layer under the navbar. The line inside it moves with the page.
  const fill = `rgba(${LINE_COLOR},${LINE_OPACITY})`;
  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="pointer-events-none"
      style={{ position: "fixed", left: 0, top: NAVBAR, width: "100%", height: `calc(100dvh - ${NAVBAR}px)` }}
    >
      <g ref={groupRef}>
        <path ref={polyRef} fill={fill} style={{ opacity: 0 }} />
        <circle ref={tipRef} fill={fill} style={{ opacity: 0 }} />
      </g>
    </svg>
  );
}

/* ---------- Page ---------- */

export default function Home() {
  // Put your picture at public/ethan.jpg. If it's missing, the placeholder shows.
  const [photoOk, setPhotoOk] = useState(true);
  // images for the hover pop-ups, from /api/covers
  const [pics, setPics] = useState<{ photos: string[]; videos: string[] }>({ photos: [], videos: [] });

  const introRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const beatEls = useRef<(HTMLDivElement | null)[]>([]);
  const dotEls = useRef<(HTMLSpanElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLElement>(null);

  // Lenis smooth scrolling (only on this page: it switches itself off when you leave)
  useEffect(() => {
    const lenis = new Lenis({ lerp: LENIS_LERP, wheelMultiplier: LENIS_WHEEL, smoothWheel: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  // Scroll-driven intro: progress p (0..1) is how far through the intro you've scrolled.
  useEffect(() => {
    const box = introRef.current;
    const stage = stageRef.current;
    const hint = hintRef.current;
    if (!box || !stage || !hint) return;

    let raf = 0, last = performance.now(), ps = 0, activeBeat = -1;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const br = box.getBoundingClientRect();
      const h = stage.clientHeight;
      const p = clamp((NAVBAR - br.top) / Math.max(1, br.height - h), 0, 1);
      ps += (p - ps) * (1 - Math.exp(-dt * 9)); // smooth out the scrolling

      BEATS.forEach((b, i) => {
        const el = beatEls.current[i];
        if (!el) return;
        const si = smooth(b.in[0], b.in[1], ps);   // 0 -> 1 as the line arrives
        const so = smooth(b.out[0], b.out[1], ps); // 0 -> 1 as the line leaves
        const op = si * (1 - so);
        const y = (1 - si) * 70 - so * 70;         // rises in from below, drifts up on the way out
        const sc = (0.9 + 0.1 * si) * (1 + so * 0.14);
        const bl = (1 - si) * 14 + so * 14;
        el.style.opacity = String(op);
        el.style.transform = `translate3d(0,${y}px,0) scale(${sc})`;
        el.style.filter = bl > 0.05 ? `blur(${bl}px)` : "none";
        el.style.visibility = op < 0.003 ? "hidden" : "visible";
      });

      const beat = ps < 0.34 ? 0 : ps < 0.68 ? 1 : 2;
      if (beat !== activeBeat) {
        activeBeat = beat;
        dotEls.current.forEach((d, i) => {
          if (!d) return;
          d.style.opacity = i === beat ? "1" : "0.3";
          d.style.transform = i === beat ? "scale(1.5)" : "scale(1)";
        });
      }
      hint.style.opacity = String(1 - smooth(0, 0.05, ps));

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/covers")
      .then((r) => r.json())
      .then((d) => { if (alive && d) setPics({ photos: d.photos ?? [], videos: d.videos ?? [] }); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Start the photo + buttons entrance when that section scrolls into view
  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("rv-in");
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <main className="relative bg-black text-white">
      {/* the curved line that follows your scrolling (sits behind everything else) */}
      <ScrollLine />

      <style>{PAGE_CSS + GLASS_CSS + INTRO_CSS + LENIS_CSS}</style>

      {/* 1) Intro: a tall block with a sticky stage. Scrolling through it swaps the three lines. */}
      <section ref={introRef} className="relative" style={{ height: INTRO_HEIGHT }}>
        <div ref={stageRef} className="sticky top-16 h-[calc(100dvh-4rem)] w-full overflow-hidden">
          {/* soft glow behind the text */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="hl-blob absolute left-[12%] top-[18%] h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="hl-blob absolute bottom-[10%] right-[10%] h-96 w-96 rounded-full bg-neutral-300/10 blur-3xl" style={{ animationDelay: "-6s" }} />
          </div>

          {/* line 1: hi (huge) */}
          <div
            ref={(el) => { beatEls.current[0] = el; }}
            className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center will-change-transform"
          >
            <h1 className="ig-in font-bold leading-[.85] tracking-[-0.06em]" style={{ fontSize: "min(34vw, 58dvh)" }}>
              hi
            </h1>
          </div>

          {/* line 2: slightly smaller */}
          <div
            ref={(el) => { beatEls.current[1] = el; }}
            className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center will-change-transform"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <p className="max-w-[16ch] text-balance font-bold leading-[.95] tracking-tight sm:max-w-none" style={{ fontSize: "clamp(2.75rem, 10vw, 9rem)" }}>
              my names ethan
            </p>
          </div>

          {/* line 3: smaller again */}
          <div
            ref={(el) => { beatEls.current[2] = el; }}
            className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center will-change-transform"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <p className="max-w-4xl text-balance font-bold leading-[1] tracking-tight" style={{ fontSize: "clamp(2rem, 6.2vw, 5.5rem)" }}>
              im a student tryna do something
            </p>
          </div>

          {/* progress dots */}
          <div aria-hidden="true" className="pointer-events-none absolute right-5 top-1/2 flex -translate-y-1/2 flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                ref={(el) => { dotEls.current[i] = el; }}
                className="block h-1.5 w-1.5 rounded-full bg-white transition duration-500"
                style={{ opacity: i === 0 ? 1 : 0.3, transform: i === 0 ? "scale(1.5)" : "scale(1)" }}
              />
            ))}
          </div>

          <div ref={hintRef} className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-xs uppercase tracking-[0.3em] text-neutral-400">
            scroll
            <span className="sc-hint block h-10 w-px bg-white/60" />
          </div>
        </div>
      </section>

      {/* 2) Photo + buttons */}
      <section ref={revealRef} className="rv relative isolate -mt-[25vh] overflow-hidden">
        {/* Soft shapes behind the glass so the blur has something to catch */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="hl-blob absolute right-[6%] top-[22%] h-72 w-72 rounded-full bg-white/25 blur-3xl" />
          <div className="hl-blob absolute bottom-[8%] left-[8%] h-80 w-80 rounded-full bg-neutral-300/15 blur-3xl" style={{ animationDelay: "-5s" }} />
          <div className="hl-blob absolute left-[42%] top-[4%] h-64 w-64 rounded-full bg-white/10 blur-3xl" style={{ animationDelay: "-9s" }} />
        </div>

        <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-16 md:min-h-[calc(100dvh-4rem-4.5rem)] md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
          {/* Left: photo */}
          <div className="mx-auto w-full max-w-sm md:max-w-none">
            <div className="hl-photo">
              <div>
                <div className="hl-frame" data-line-target>
                  <svg data-frame-svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                    <path data-frame-cw fill="none" stroke="#fff" strokeWidth={FRAME_W} strokeLinecap="round" pathLength={1} style={{ opacity: 0 }} />
                    <path data-frame-ccw fill="none" stroke="#fff" strokeWidth={FRAME_W} strokeLinecap="round" pathLength={1} style={{ opacity: 0 }} />
                  </svg>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-neutral-900">
                    {photoOk ? (
                      <Image
                        src="/ethan.jpg"
                        alt="Photo of me"
                        fill
                        sizes="(min-width: 768px) 40vw, 90vw"
                        className="object-cover"
                        onError={() => setPhotoOk(false)}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-neutral-500">
                        <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" />
                        </svg>
                        <p className="text-sm">
                          Add your photo at <code>public/ethan.jpg</code>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: a title, then two wide glass rectangles stacked on each other */}
          <div>
            <h2 className="hl-head relative z-10 mb-10 text-3xl font-bold tracking-tight sm:text-4xl">some cool things</h2>
            <div className="flex flex-col gap-4 sm:gap-5">
              <GlassTile href="/photos" title="Photos" description="some cool still shots" icon={PhotoIcon} wide className="h-28 sm:h-32" delay={300} pics={pics.photos} dir="up" />
              <GlassTile href="/videos" title="Videos" description="some small moments" icon={VideoIcon} wide className="h-28 sm:h-32" delay={450} pics={pics.videos} dir="down" />
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 px-6 pb-6 pt-2 text-xs text-neutral-500">
          <a
            href={`mailto:${EMAIL}`}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Contact me
          </a>
          <span>© 2026 Ethan Wang. All rights reserved.</span>
        </footer>
      </section>
    </main>
  );
}