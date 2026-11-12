"use client";
// app/page.tsx  (everything for the home page lives in this one file)

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import Lenis from "lenis";
import * as THREE from "three";

// ---- About me section: edit these ----
const ABOUT_TITLE = "who am i?";
// Each line in quotes is one paragraph. Change them, add more, or delete some.
const ABOUT_TEXT = [
  "hi my names ethan",
  "site is still a work in progress!",
];

// a word in ABOUT_TEXT that gets written and circled in blue, like with a marker, when the "who am i" page shows ("" = none)
const ABOUT_CIRCLE = "ethan";

// ---- The rest of your about me: edit these ----
// These show under "who am i?" on the first page of the camera's screen, in two columns: the professional side
// on the left and the personal side on the right. Anything in [square brackets] is a placeholder: swap it for your own words (and drop the brackets).
// Keep each one to a line or two so it all fits on a phone. You can delete a row or add one (5 or so per side fits best).
const ABOUT_PRO: { title: string; text: string }[] = [
  { title: "what i do", text: "currently a student, trying to make and do cool things" },
  { title: "what i shoot", text: "events, street and sports," },
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
// photos: the three albums shot most recently show up by themselves, newest first (by the date stored in the photos).
// To always show certain albums instead, put their folder names here, e.g. ["OASIS", "senior sunrise"]
const HOME_ALBUMS: string[] = [];
// which photo each album shows on this page, and which part of it stays in view (the tiles are tall and thin).
// "photo" is the file name inside the album's folder, written exactly. "focus" is optional: "50% 50%" is the middle,
// "50% 20%" keeps nearer the top, "30% 50%" keeps more of the left. Albums not listed use their normal cover.
// (the covers on the main photos page are set separately, in app/photos/FolderCarousel.tsx)
const HOME_COVERS: Record<string, { photo: string; focus?: string }> = {
  "senior volleyball team '26-27": { photo: "christian.jpg" },
  "OASIS": { photo: "IMG_9842.JPG" },
};
// videos: the one video to feature. Put the file in public/videos/ and write its path, for example "/videos/reel.mp4".
// Leave src "" to show a "coming soon" box. poster = an optional picture shown before it plays.
const HOME_VIDEO = { title: "coming soon", caption: "to be annnounced", src: "", poster: "" };
// projects: a short list. Copy the example block (without the //) to add one, newest first.
const HOME_PROJECTS: { date: string; title: string; text: string; href: string }[] = [
  // { date: "mar '26", title: "my project", text: "one line about it", href: "/projects" },
];

// the last page on the camera's screen
const CONTACT_TITLE = "contact me";
const CONTACT_TEXT = "want to shoot something together, or just say hi?";
// the details next to it (underneath on phones), one per row. Anything in [square brackets] is a placeholder:
// swap it for your own words (and drop the brackets). Delete a row or add one (5 or 6 fits best).
// A row can have `links` instead of `text`: each one shows as its name and opens in a new tab.
const CONTACT_MORE: { title: string; text?: string; links?: { label: string; href: string }[] }[] = [
  { title: "best for", text: "event coverage, portraits, sports, & collabs" },
  { title: "availability", text: "weekends" },
  { title: "reply time", text: "usually within a day" },
  { title: "based in", text: "Toronto" },
  { title: "find me on", links: [
    { label: "instagram", href: "https://instagram.com/etnwingwang" },
    { label: "github", href: "https://github.com/ethanwang271-art" },
    { label: "linkedin", href: "https://www.linkedin.com/in/ethan-wang-9206563a1/" },
  ] },
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
const PAGE_BG = "255,255,255";    // r,g,b of the page's background (white)
const PAGE_INK = "17,17,17";      // r,g,b of the writing on it (near black)
const MARKER_BLUE = "100,159,255"; // r,g,b of your name on "who am i" and the marker circle round it (the site blue)
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
/* the same button on the white page (the ones on the camera's black screen keep the light writing) */
.contact-btn.on-light { color: #0d2350; background: rgba(${BLUE}, .1); }
.contact-btn.on-light:hover, .contact-btn.on-light:focus-visible { background: rgba(${BLUE}, .22); box-shadow: 0 0 22px rgba(${BLUE}, .3); }
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

// make the whole page the same white
const BG_CSS = `
html, body { background-color: rgb(${PAGE_BG}) !important; }
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
      <div ref={ringRef} aria-hidden="true" className="cursor-ring" style={{ ...base, width: CURSOR_RING, height: CURSOR_RING, border: "1px solid rgba(255,255,255,.75)", mixBlendMode: "difference" }} />
      <div ref={dotRef} aria-hidden="true" className="cursor-dot" style={{ ...base, width: CURSOR_DOT, height: CURSOR_DOT, background: `rgb(${BLUE})`, boxShadow: `0 0 10px rgba(${BLUE},.9)` }} />
    </>
  );
}

/* ---------- The camera ---------- */

const CAMERA_HEIGHT = "600vh";              // how much scrolling the whole camera part takes (more = slower)
const CAMERA_TURN = 0.2;                    // how much of that scrolling it takes to turn round and zoom in on the screen (0.2 = the first 20%). The rest swipes through the screen's pages
const CAMERA_START_SIZE = 0.62;             // how big the whole camera is at the start (1 = as big as fits)
const CAMERA_SCREEN_SIZE = 0.86;            // once zoomed in, how much of the window's width the camera's screen may fill (it also always fits the height)
const CAMERA_SWIPE = 50;                    // how far (px) you have to swipe or drag across the screen to go to the next page
const CAMERA_YAW = 0;                       // how far it's turned at the start, in degrees (0 = facing you straight on)
const CAMERA_TILT = 0;                      // how much you look down on it at the start, in degrees
const CAMERA_SPIN = 0.45;                   // at the start you can drag the camera round to look at it from any side: degrees it turns per pixel dragged
const CAMERA_MOUSE = 6;                     // how much it leans to follow the mouse at the start, in degrees (0 = not at all)
const CAMERA_SPIN_UNTIL = 0.48;              // you can still drag the camera round until it has zoomed this far towards its screen (0 = only before any scrolling, 1 = right up to the screen)
const CAMERA_SNAP = 0.35;                   // when you stop scrolling between two pages, it glides to the nearest one in this many seconds (0 = off)
const CAMERA_DOTS = "235,235,235";          // r,g,b of the little dots on the camera's back screen (soft white)
const CAMERA_DOTS_LIT = "255,255,255";      // r,g,b of a dot once the pointer has passed over it (bright white)
const CAMERA_DOT_GAP = 7;                   // how far apart the dots on the screen are (lower = more, finer dots; about 4.5 = 1mm)
const CAMERA_DOT_FAINT = 0.2;               // how visible the dots are before you hover over them (0 = hidden until lit)
const CAMERA_DOT_TURN = 0.05;               // the dots only light up when you can see the screen: how much it has to face you (0 = side on, 1 = straight from the back)
const CAMERA_BRUSH = 0.05;                  // how big the patch that lights up under the pointer is, compared to the window (0.05 = 5% of its shorter side)
const CAMERA_SHARPNESS = 2;                 // how sharp the camera is drawn on high-resolution screens (2 = fully sharp, 1 = fastest)
const CAMERA_XRAY_GHOST = 0.055;             // in x-ray view, how visible the outside of the camera stays (0 = gone, 1 = solid)
const CAMERA_XRAY_LINES = "30,48,80";       // in x-ray view, r,g,b of the fine lines round the edges of the outside
const CAMERA_FSTOP = 4.5;                   // the f-number shown in the bar along the top of the camera's screen
const CAMERA_APERTURE_BLADES = 7;           // how many blades the aperture inside the lens has (the kit lens has 7)
// the pages on the camera's screen, in order
const SCREEN_PAGES = ["who am i", "photos", "videos", "projects", "contact"];

// where the camera is and which way it faces. cx/cy = where it sits on the page, scale = how big (pixels per unit),
// yaw/tilt/roll = turned round / tipped forward / tipped on its side (radians),
// px/py/pz = the point on the model it turns around, depth = how strong the perspective is (higher = flatter)
type CameraPose = { yaw: number; tilt: number; roll: number; cx: number; cy: number; scale: number; px: number; py: number; pz: number; depth: number };

// The camera is a solid 3D model, built here out of simple pieces: flat outlines given a thickness, round shapes
// spun around a line, and boxes. Units are about 4.5 per millimetre. x = right, y = down, z = away from you when
// the lens points at you (so the lens sticks out towards -z, and the body sits from z 0 to 185).
type V3 = { x: number; y: number; z: number };

// where the lens is (its middle, seen from the front)
const LENS_X = 0, LENS_Y = 30;
// the screen on the back: the middle of its picture, its size (3 by 2, like the real one) and how far back it is
const SCREEN_X = 19, SCREEN_Y = 64.5, SCREEN_W = 338, SCREEN_H = 225, SCREEN_Z = 198;
// Places to attach other models later (a flash, a microphone, a tripod...), in the camera's own units.
// To add one: write a function like buildLens below that adds its pieces to the kit, shift its pieces to start
// at one of these points, and add the function to CAMERA_PARTS.
const CAMERA_ANCHORS = {
  hotShoe: { x: 6, y: -208, z: 120 },    // the flash shoe on top of the viewfinder
  coldShoe: { x: 211, y: -158, z: 23 },  // the extra shoe on the cage, on the arm beside the viewfinder hump
  tripod: { x: 0, y: 241, z: 95 },       // the screw thread underneath
  lensFront: { x: LENS_X, y: LENS_Y, z: -477 }, // the front of the filter
};

// where a point on the model lands on the page in a pose (z = how far behind the turning point it is)
function poseProjector(o: CameraPose) {
  const cY = Math.cos(o.yaw), sY = Math.sin(o.yaw), cT = Math.cos(o.tilt), sT = Math.sin(o.tilt);
  const cR = Math.cos(o.roll), sR = Math.sin(o.roll), s = o.scale, F = o.depth;
  return (p: V3) => {
    const X = p.x - o.px, Y = p.y - o.py, Z = p.z - o.pz;
    const x1 = X * cY + Z * sY, z1 = -X * sY + Z * cY;
    const y2 = Y * cT - z1 * sT, z2 = Y * sT + z1 * cT;
    const k = F / (F + z2);
    const a = x1 * s * k, b = y2 * s * k;
    return { x: o.cx + a * cR - b * sR, y: o.cy + a * sR + b * cR, z: z2 };
  };
}

// where the camera's back screen ends up on the page (its picture area)
type ScreenBox = { x: number; y: number; w: number; h: number };
function screenBoxFor(o: CameraPose): ScreenBox {
  const proj = poseProjector(o);
  const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => proj({ x: SCREEN_X + (a * SCREEN_W) / 2, y: SCREEN_Y + (b * SCREEN_H) / 2, z: SCREEN_Z }));
  const xs = q.map((p) => p.x), ys = q.map((p) => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
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

// ---- shape helpers ----

// how a flat outline's (u, v) and its thickness (t) map onto the model:
// "front" = drawn as seen from the front, thick front to back. "side" = drawn from the side (u = front to back),
// thick left to right. "top" = drawn from above (v = front to back), thick top to bottom.
type Basis = "front" | "side" | "top";
const BASIS: Record<Basis, THREE.Matrix4> = {
  front: new THREE.Matrix4(),
  side: new THREE.Matrix4().set(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1),
  top: new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1),
};

// turn every triangle to face the other way (needed after a shape is mirrored into place)
function flipWinding(g: THREE.BufferGeometry) {
  const idx = g.getIndex();
  if (idx) {
    const a = idx.array;
    for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; }
    idx.needsUpdate = true;
  } else {
    const n = g.getAttribute("position").count, a = new Uint32Array(n);
    for (let i = 0; i < n; i += 3) { a[i] = i; a[i + 1] = i + 2; a[i + 2] = i + 1; }
    g.setIndex(new THREE.BufferAttribute(a, 1));
  }
}
function place<T extends THREE.BufferGeometry>(g: T, m: THREE.Matrix4): T {
  g.applyMatrix4(m);
  if (m.determinant() < 0) flipWinding(g);
  return g;
}

// an outline written like an SVG path ("M x y L x y Q ... C ... Z")
function shapeOf(d: string): THREE.Shape {
  const t = d.match(/[MLQCZ]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  const s = new THREE.Shape();
  let i = 0, cmd = "";
  const n = () => parseFloat(t[i++]);
  while (i < t.length) {
    if (/[MLQCZ]/.test(t[i])) cmd = t[i++];
    if (cmd === "Z") { s.closePath(); break; }
    if (cmd === "M") { s.moveTo(n(), n()); cmd = "L"; }
    else if (cmd === "L") s.lineTo(n(), n());
    else if (cmd === "Q") s.quadraticCurveTo(n(), n(), n(), n());
    else if (cmd === "C") s.bezierCurveTo(n(), n(), n(), n(), n(), n());
    else i++;
  }
  return s;
}
// a rectangle with rounded corners, as an outline
const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;

// a flat outline with a thickness, from t0 to t1. bevel = how rounded its edges are, holes = [x, y, radius] drilled through
function extrude(d: string | THREE.Shape, t0: number, t1: number, basis: Basis = "front", bevel = 0, holes: [number, number, number][] = []) {
  const shape = typeof d === "string" ? shapeOf(d) : d;
  for (const [x, y, r] of holes) {
    const h = new THREE.Path();
    h.absarc(x, y, r, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const b = Math.max(0, Math.min(bevel, (t1 - t0) / 2 - 0.05));
  const g = new THREE.ExtrudeGeometry(shape, { depth: t1 - t0 - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, t0 + b);
  return place(g, BASIS[basis]);
}

function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

// a point on a circle around one of the three directions: axis "z" = the lens's direction, "y" = up and down, "x" = left to right.
// (c1, c2) = the centre (x,y for "z"; x,z for "y"; y,z for "x"), t = how far along the axis
type Axis = "x" | "y" | "z";
function around(axis: Axis, c1: number, c2: number, t: number, r: number, a: number): V3 {
  const p = c1 + r * Math.cos(a), q = c2 + r * Math.sin(a);
  return axis === "z" ? { x: p, y: q, z: t } : axis === "y" ? { x: p, y: t, z: q } : { x: t, y: p, z: q };
}

// a round part: prof = [how far along the axis, radius] going round the outline of its cross-section (a closed loop)
function lathe(prof: [number, number][], axis: Axis, c1: number, c2: number, segs = 72) {
  let loop = prof.map(([t, r]) => new THREE.Vector2(Math.max(r, 0.001), t));
  // go round the way that puts the outside on the outside
  let area = 0;
  loop.forEach((p, i) => { const q = loop[(i + 1) % loop.length]; area += p.x * q.y - q.x * p.y; });
  if (area < 0) loop = loop.reverse();
  loop.push(loop[0].clone());
  // sharp corners stay sharp: a corner gets two points, so each side keeps its own shading
  const pts: THREE.Vector2[] = [];
  loop.forEach((q, i) => {
    pts.push(q);
    if (i === 0 || i === loop.length - 1) return;
    const a = loop[i - 1], b = loop[i + 1];
    const turn = Math.abs(Math.atan2((q.x - a.x) * (b.y - q.y) - (q.y - a.y) * (b.x - q.x), (q.x - a.x) * (b.x - q.x) + (q.y - a.y) * (b.y - q.y)));
    if (turn > 0.45) pts.push(q.clone());
  });
  const g = new THREE.LatheGeometry(pts, segs);
  const m = new THREE.Matrix4();
  if (axis === "z") m.set(1, 0, 0, c1, 0, 0, 1, c2, 0, 1, 0, 0, 0, 0, 0, 1);
  else if (axis === "y") m.set(1, 0, 0, c1, 0, 1, 0, 0, 0, 0, 1, c2, 0, 0, 0, 1);
  else m.set(0, 1, 0, 0, 1, 0, 0, c1, 0, 0, 1, c2, 0, 0, 0, 1);
  return place(g, m);
}
// a ring (or with r0 = 0, a solid cylinder) from t0 to t1 along the axis. chamfer = how much its outer edges are cut off
function ring(r0: number, r1: number, t0: number, t1: number, axis: Axis, c1: number, c2: number, chamfer = 0, segs = 72) {
  const c = Math.min(chamfer, Math.abs(t1 - t0) / 2, (r1 - r0) / 2);
  const p: [number, number][] = c > 0
    ? [[t0, r0], [t0, r1 - c], [t0 + Math.sign(t1 - t0) * c, r1], [t1 - Math.sign(t1 - t0) * c, r1], [t1, r1 - c], [t1, r0]]
    : [[t0, r0], [t0, r1], [t1, r1], [t1, r0]];
  return lathe(p, axis, c1, c2, segs);
}
const cyl = (r: number, t0: number, t1: number, axis: Axis, c1: number, c2: number, chamfer = 0, segs = 48) => ring(0, r, t0, t1, axis, c1, c2, chamfer, segs);

// a surface made from a grid of points: f(u, v) gives the point (u and v go from 0 to 1). closeU = it joins up
// with itself going round. It's made to face away from `inside`. flat = every little face is flat (for ridges)
function surface(nu: number, nv: number, f: (u: number, v: number) => V3, closeU: boolean, inside: V3, flat = false) {
  const cols = closeU ? nu : nu + 1, rows = nv + 1;
  const pos = new Float32Array(cols * rows * 3), uv = new Float32Array(cols * rows * 2);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p = f(i / nu, j / nv), k = j * cols + i;
      pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
      uv[k * 2] = (i / nu) * 14; uv[k * 2 + 1] = (j / nv) * 18;
    }
  }
  const idx: number[] = [];
  let vote = 0;
  const P = (k: number) => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  const mid = new THREE.Vector3(inside.x, inside.y, inside.z);
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * cols + i, b = j * cols + ((i + 1) % cols), c = (j + 1) * cols + ((i + 1) % cols), d = (j + 1) * cols + i;
      idx.push(a, b, c, a, c, d);
      const A = P(a), n = P(b).sub(A).cross(P(c).sub(A));
      vote += Math.sign(n.dot(A.sub(mid)));
    }
  }
  let g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  if (vote < 0) flipWinding(g);
  if (flat) g = g.toNonIndexed();
  g.computeVertexNormals();
  return g;
}
// a ridged ring, like the grip on a dial or a zoom ring: radius r at the top of the ridges, `depth` deep, from t0 to t1
function ribbed(r: number, depth: number, teeth: number, t0: number, t1: number, axis: Axis, c1: number, c2: number) {
  const nu = teeth * 4, at = [0.12, 0.3, 0.7, 0.88], rad = [r - depth, r, r, r - depth];
  return surface(nu, 1, (u, v) => {
    const i = Math.round(u * nu) % nu, tooth = Math.floor(i / 4), ph = i % 4;
    return around(axis, c1, c2, t0 + (t1 - t0) * v, rad[ph], ((tooth + at[ph]) / teeth) * Math.PI * 2);
  }, true, around(axis, c1, c2, (t0 + t1) / 2, 0, 0), true);
}

// a diamond-knurled ring (a grid of tiny pyramids, like the grip on a metal dial): n pyramids round it, `rows` along it
function knurled(r: number, depth: number, n: number, rows: number, t0: number, t1: number, axis: Axis, c1: number, c2: number) {
  const nu = n * 2, nv = rows * 2;
  return surface(nu, nv, (u, v) => {
    const i = Math.round(u * nu) % nu, j = Math.round(v * nv);
    return around(axis, c1, c2, t0 + (t1 - t0) * v, r - ((i + j) % 2 ? depth : 0), (i / nu) * Math.PI * 2);
  }, true, around(axis, c1, c2, (t0 + t1) / 2, 0, 0), true);
}

// a picture drawn on a little canvas, to stick onto the model (button labels, dial letters, the screen's dots)
function drawnTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d");
  if (c) draw(c, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
// white writing (each line in `lines` on its own row)
const label = (lines: string[], size = 0) => drawnTexture(256, 256, (c, w, h) => {
  const longest = Math.max(...lines.map((l) => l.length));
  const px = size || Math.min(200 / lines.length, 330 / Math.max(1.6, longest));
  c.fillStyle = "#e9e9e9";
  c.font = `700 ${px}px Arial, Helvetica, sans-serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * px * 1.05));
});
// a flat picture stuck on the model at `at`, w wide and h tall. right / up = which way its right and its top point
function decal(tex: THREE.Texture, w: number, h: number, at: V3, right: V3, up: V3) {
  const g = new THREE.PlaneGeometry(w, h);
  const r = new THREE.Vector3(right.x, right.y, right.z).normalize(), u = new THREE.Vector3(up.x, up.y, up.z).normalize();
  g.applyMatrix4(new THREE.Matrix4().makeBasis(r, u, new THREE.Vector3().crossVectors(r, u)).setPosition(at.x, at.y, at.z));
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
}

// ---- what it's made of ----
function cameraMaterials() {
  const std = (color: number, roughness: number, metalness = 0, more: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...more });
  const glass = (color: number, opacity: number, more: THREE.MeshPhysicalMaterialParameters = {}) =>
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.04, metalness: 0, transparent: true, opacity, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, ...more });
  // a fine leather-like grain for the rubber on the grip
  const grain = drawnTexture(128, 128, (c, w, h) => {
    // pebbles like the leather-look rubber on the real camera: rounded bumps with dark creases between them
    c.fillStyle = "#2c2c2c";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 6 + Math.random() * 6;
      // drawn again past each edge, so the pattern repeats without a seam
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        g.addColorStop(0, "#e2e2e2");
        g.addColorStop(0.7, "#b0b0b0");
        g.addColorStop(1, "#3c3c3c");
        c.fillStyle = g;
        c.beginPath();
        c.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        c.fill();
      }
    }
  });
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.colorSpace = THREE.NoColorSpace;
  return {
    // the outside
    body: std(0x171718, 0.6),                                   // the body's matt black plastic
    gloss: std(0x0c0c0d, 0.3),                                  // buttons and dials
    rubber: std(0x121213, 0.82, 0, { bumpMap: grain, bumpScale: 3 }), // the grip
    rubberPlain: std(0x0f0f10, 0.92),                           // eyecup, thumb rest, covers
    cage: std(0x1b1c1f, 0.46, 0.85),                            // the cage's dark metal
    silver: std(0xc6c7cb, 0.28, 1),                             // the lens mount, the flash shoe
    steel: std(0x9c9ea3, 0.36, 1),                              // screws
    dimSilver: std(0x7d7f84, 0.35, 1),                          // the thin ring on the lens
    barrel: std(0x131314, 0.48),                                // the lens's plastic
    barrelSoft: std(0x161617, 0.7, 0, { side: THREE.DoubleSide }), // the hood
    ribs: std(0x0d0d0e, 0.88),                                  // the rubber rings on the lens
    black: std(0x030303, 1),                                    // inside the lens: nothing shines
    red: std(0xc2221d, 0.4),                                    // the dot on the record button
    lamp: std(0x3a0d0a, 0.15),                                  // the little lamp on the front
    screenGlass: new THREE.MeshPhysicalMaterial({ color: 0x030304, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
    // glass
    lensGlass: glass(0xcfe6f2, 0.3, { iridescence: 0.9, iridescenceIOR: 1.6 }),
    filterGlass: glass(0xffffff, 0.1),
    blade: std(0x26262b, 0.42, 0.85),                           // the aperture blades
    // the insides
    pcb: std(0x0e5a3c, 0.55),                                   // circuit boards
    chip: std(0x18181b, 0.45),
    chipTop: std(0x6c6f76, 0.35, 0.6),
    can: std(0xb9bbc0, 0.42, 1),                                // metal covers, motors, sockets
    gold: std(0xd9ab45, 0.3, 1),
    copper: std(0xc0763a, 0.35, 1),
    flex: std(0xd07e2c, 0.55),                                  // the orange ribbon cables
    frame: std(0x3a3d44, 0.5, 0.6),
    cell: std(0x2a2b30, 0.6),                                   // the rings that hold each piece of glass
    ceramic: std(0xd2d2ca, 0.6),
    sensor: new THREE.MeshPhysicalMaterial({ color: 0x1d3a4a, roughness: 0.12, metalness: 0.5, iridescence: 1, iridescenceIOR: 1.9, clearcoat: 1 }),
    battery: std(0x2a2c31, 0.6),
    paper: std(0x9da0a6, 0.7),                                  // labels
    card: std(0x1e52b0, 0.5),
    brass: std(0xb9953f, 0.35, 1),
    conn: std(0xd8d2bf, 0.6),                                   // plastic plugs on the boards
    oled: std(0x0b1020, 0.3, 0, { emissive: 0x7fb0ff, emissiveIntensity: 0.9 }), // the tiny screen inside the viewfinder
  };
}
type CameraMaterials = ReturnType<typeof cameraMaterials>;

// The kit the parts are built with: shell = something on the outside (it goes see-through in x-ray view),
// inside = something inside (only seen in x-ray view), glass = lens glass and other parts that are always there,
// mark = writing or a picture stuck on the outside
type Kit = {
  M: CameraMaterials;
  shell: (g: THREE.BufferGeometry, m: THREE.Material, lines?: boolean) => THREE.Mesh;
  inside: (g: THREE.BufferGeometry, m: THREE.Material) => THREE.Mesh;
  glass: (g: THREE.BufferGeometry, m: THREE.Material) => THREE.Mesh;
  mark: (mesh: THREE.Mesh) => void;
};

// ---- the body (a small full-frame mirrorless camera, no logos). Seen from the front, the grip is on the left,
// the lens sits a little right of the middle, and the viewfinder hump is above the lens. ----
function buildBody(k: Kit) {
  const { M } = k;
  // the main box, drawn from above and given its height
  k.shell(extrude("M -350 0 L 216 0 Q 246 0 246 30 L 246 155 Q 246 185 216 185 L -320 185 Q -350 185 -350 155 Z", -128, 185, "top", 12), M.body);

  // the grip: its outline from above at each height, top to bottom [how far down, how far it sticks out], smoothed.
  // The top slopes forward (where the shutter button sits), then a dip for your middle finger, then it fills out
  const gripPlan = (g: number) =>
    shapeOf(`M -150 0 Q -182 0 -190 ${-0.35 * g} L -200 ${-0.72 * g} Q -207 ${-g} -246 ${-g} L -300 ${-g} Q -346 ${-g} -350 ${-0.5 * g} L -350 0`).getPoints(10);
  const K: [number, number][] = [[-125, 8], [-120, 40], [-104, 88], [-62, 82], [30, 96], [150, 96], [176, 92], [184, 76]];
  const spline = (a: number, b: number, c: number, d: number, t: number) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  const levels = 36, rings: V3[][] = [];
  for (let j = 0; j <= levels; j++) {
    const s = (j / levels) * (K.length - 1), i = Math.min(K.length - 2, Math.floor(s)), t = s - i;
    const q = (n: number) => K[clamp(n, 0, K.length - 1)];
    const y = spline(q(i - 1)[0], q(i)[0], q(i + 1)[0], q(i + 2)[0], t), g = spline(q(i - 1)[1], q(i)[1], q(i + 1)[1], q(i + 2)[1], t);
    rings.push(gripPlan(g).map((p) => ({ x: p.x, y, z: p.y })));
  }
  // close it over at the top and the bottom
  const capOf = (r: V3[]) => r.map(() => ({ x: r.reduce((s, p) => s + p.x, 0) / r.length, y: r[0].y, z: r.reduce((s, p) => s + p.z, 0) / r.length }));
  rings.unshift(capOf(rings[0]));
  rings.push(capOf(rings[rings.length - 1]));
  const gn = rings[0].length - 1;
  k.shell(surface(gn, rings.length - 1, (u, v) => rings[Math.round(v * (rings.length - 1))][Math.round(u * gn)], false, { x: -260, y: 30, z: -30 }), M.rubber, false);

  // the viewfinder hump: it leans out a little over the lens mount, with the flash shoe on top
  k.shell(extrude("M -92 -120 L -66 -184 Q -62 -192 -50 -192 L 62 -192 Q 74 -192 78 -184 L 104 -120 Z", -14, 185, "front", 7), M.body);
  k.shell(box(-40, 52, -196, -191, 62, 180), M.silver);
  for (const [a, b, c, d] of [[-40, -30, -207, -196], [42, 52, -207, -196], [-40, -22, -209, -205], [34, 52, -209, -205]]) k.shell(box(a, b, c, d, 62, 180), M.silver);
  k.shell(box(-30, 42, -197.5, -195.5, 70, 176), M.gloss);
  // the viewfinder eyecup on the back, and the window you look through
  // a soft rubber rim, open in the middle...
  const cup = shapeOf("M -70 -184 L 82 -184 Q 96 -184 98 -170 L 106 -72 Q 106 -52 86 -52 L -74 -52 Q -94 -52 -94 -72 L -86 -170 Q -84 -184 -70 -184 Z");
  cup.holes.push(shapeOf(rr(-70, -168, 82, -68, 18)));
  k.shell(extrude(cup, 178, 214, "front", 5), M.rubberPlain);
  // ...and set back inside it: the floor, a raised frame, the wide window you look through, and the eye sensor beside it
  k.shell(box(-74, 86, -172, -64, 178, 199), M.rubberPlain, false);
  k.shell(extrude(rr(-60, -160, 72, -76, 12), 199, 205, "front", 2), M.body);
  k.shell(extrude(rr(-14, -152, 64, -84, 9), 205, 206.6, "front", 0.6), M.screenGlass, false);
  k.shell(extrude(rr(-52, -146, -24, -92, 7), 205, 206.4, "front", 0.6), M.black, false);

  // the ring the lens locks into
  k.shell(ring(150, 166, -9, 3, "z", LENS_X, LENS_Y, 2), M.body);
  k.shell(ring(128, 150, -12, 0, "z", LENS_X, LENS_Y, 1), M.silver);
  // on the front: the lens release button beside it, and the little lamp by the grip
  k.shell(extrude(rr(186, -22, 218, 50, 13), -9, 2, "front", 3.5), M.gloss);
  k.shell(cyl(9, -3, 2, "z", -136, -96, 1), M.lamp);

  // on top, grip side: the shutter button on the slope of the grip, the main dial just behind it, and a small button
  k.shell(cyl(24, -126, -108, "y", -282, -60, 2), M.body);
  k.shell(cyl(16, -131, -125, "y", -282, -60, 2), M.gloss);
  k.shell(ribbed(23, 1.8, 30, -16, 14, "z", -298, -122), M.gloss, false);
  k.shell(cyl(22.5, -17.5, 15.5, "z", -298, -122, 1.5), M.gloss);
  k.shell(cyl(7, -128, -116, "y", -258, -26, 1), M.gloss);
  // the mode dial next to the hump, with its letters
  k.shell(ribbed(40, 2.2, 44, -150, -126, "y", -140, 95), M.gloss, false);
  k.shell(cyl(40, -153.5, -150, "y", -140, 95, 1.5), M.gloss);
  k.mark(decal(drawnTexture(256, 256, (c, w, h) => {
    const names = ["M", "Av", "Tv", "P", "Fv", "A+", "SCN", "C1", "C2", "B"];
    c.fillStyle = "#e9e9e9";
    c.font = "700 27px Arial, Helvetica, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    names.forEach((nm, i) => {
      c.save();
      c.translate(w / 2, h / 2);
      c.rotate((i / names.length) * Math.PI * 2);
      c.fillText(nm, 0, -86);
      c.restore();
    });
  }), 74, 74, { x: -140, y: -153.9, z: 95 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }));
  // the record button with its red dot
  k.shell(cyl(10, -131.5, -126, "y", -222, 53, 1.5), M.gloss);
  k.shell(cyl(4.5, -132.4, -131, "y", -222, 53), M.red);
  // the back dial with the power switch round it
  k.shell(cyl(46, -134, -126, "y", -272, 124, 1.5), M.body);
  k.shell(box(-234, -218, -134, -128, 140, 158), M.body);
  k.shell(ribbed(37, 2, 40, -152, -134, "y", -272, 124), M.gloss, false);
  k.shell(cyl(37, -155, -152, "y", -272, 124, 1.5), M.gloss);
  // on top, the other side: the photo / video switch
  k.shell(cyl(30, -141, -126, "y", 176, 120, 2), M.body);
  k.shell(cyl(24, -146, -141, "y", 176, 120, 1.5), M.gloss);
  k.shell(box(196, 214, -141, -133, 86, 100), M.body);

  // on the back: the flip-out screen with its hinge...
  k.shell(extrude(rr(-166, -60, 204, 183, 7), 183, 197, "front", 3), M.body);
  k.shell(box(-160, 198, -55, 180, 196.4, 197.5), M.screenGlass);
  k.shell(extrude(rr(206, -40, 232, 165, 5), 181, 196, "front", 3), M.body);
  // ...the thumb rest, and the buttons with their labels
  // (the rubber on the back has the same grain as the grip)
  const grained = (g: THREE.BufferGeometry) => {
    const uv = g.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.06, uv.getY(i) * 0.06);
    return g;
  };
  // the big pad of grained rubber under your thumb: it starts beside the screen, steps round the top buttons,
  // runs down the edge of the back and curves round the ring of buttons
  k.shell(grained(extrude("M -185 -80 Q -185 -90 -195 -90 L -238 -90 Q -248 -90 -248 -80 L -246 -48 Q -244 -34 -268 -20 L -298 -4 Q -310 2 -326 2 L -326 162 Q -326 172 -316 172 L -306 172 Q -298 172 -296 160 L -291 112 Q -290 56 -252 32 L -200 6 Q -185 -4 -185 -20 Z", 183, 188, "front", 2.5)), M.rubber, false);
  // the speaker holes beside the viewfinder
  k.mark(decal(drawnTexture(128, 128, (c) => {
    c.fillStyle = "#050505";
    for (const [x, y] of [[64, 64], [64, 28], [64, 100], [28, 64], [100, 64], [40, 40], [88, 40], [40, 88], [88, 88]]) { c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2); c.fill(); }
  }), 24, 24, { x: -116, y: -70, z: 185.3 }, { x: -1, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }));
  const back = (tex: THREE.Texture, x: number, y: number, size: number) =>
    k.mark(decal(tex, size, size, { x, y, z: 191.6 }, { x: -1, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }));
  const icon = (draw: (c: CanvasRenderingContext2D) => void) => drawnTexture(128, 128, (c) => { c.fillStyle = c.strokeStyle = "#e9e9e9"; c.lineWidth = 9; draw(c); });
  const buttons: [number, number, number, THREE.Texture][] = [
    [178, -74, 16, label(["MENU"])],
    [-270, -64, 17, label(["AF", "ON"])],
    [-316, -64, 13, label(["*"], 230)],
    [-320, -28, 12, icon((c) => { for (let i = 0; i < 9; i++) c.fillRect(22 + (i % 3) * 32, 22 + Math.floor(i / 3) * 32, 20, 20); })],
    [-205, 24, 16, label(["INFO"])],
    [-205, 142, 14, icon((c) => { c.fillStyle = c.strokeStyle = "#5aa8ee"; c.strokeRect(18, 26, 92, 76); c.beginPath(); c.moveTo(48, 42); c.lineTo(86, 64); c.lineTo(48, 86); c.closePath(); c.fill(); })],
    [-266, 142, 14, icon((c) => { c.fillStyle = c.strokeStyle = "#5aa8ee"; c.strokeRect(38, 44, 52, 62); c.fillRect(28, 26, 72, 10); c.fillRect(52, 14, 24, 10); })],
  ];
  for (const [x, y, r, tex] of buttons) {
    k.shell(cyl(r, 183, 191, "z", x, y, 2), M.gloss);
    k.shell(ring(r, r + 3.5, 183, 188.6, "z", x, y, 1), M.body, false); // the raised rim round each button
    back(tex, x, y, r * 1.55);
  }
  k.shell(ring(22, 40, 183, 189.5, "z", -239, 76, 2), M.gloss);
  k.shell(ring(40, 43.5, 183, 188.6, "z", -239, 76, 1), M.body, false);
  k.shell(cyl(17, 183, 191, "z", -239, 76, 2), M.gloss);
  back(label(["Q", "SET"]), -239, 76, 21);
  // the four ways the ring round it presses, and the magnifier under the top buttons
  for (const [dx, dy] of [[0, -31], [0, 31], [-31, 0], [31, 0]]) k.shell(cyl(1.8, 189.5, 190.2, "z", -239 + dx, 76 + dy), M.conn, false);
  k.mark(decal(icon((c) => { c.strokeStyle = "#5aa8ee"; c.lineWidth = 12; c.beginPath(); c.arc(52, 52, 26, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(72, 72); c.lineTo(108, 108); c.stroke(); }),
    13, 13, { x: -330, y: -9, z: 188.4 }, { x: -1, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }));

  // small details: the red dot on the mount for lining a lens up, the white mark the mode dial turns to,
  // the words by the power switch and the photo / video switch, and the textured rubber beside the mount
  k.shell(cyl(3.5, -12.9, -12, "z", LENS_X, LENS_Y - 145), M.red, false);
  k.shell(box(-93, -89, -129, -128, 91, 99), M.conn, false);
  const onTop = (words: string[], x: number, z: number, size: number) =>
    k.mark(decal(label(words), size, size, { x, y: -128.5, z }, { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }));
  onTop(["ON"], -206, 132, 15);
  onTop(["OFF"], -206, 166, 15);
  onTop(["LOCK"], -206, 149, 15);
  onTop(["PHOTO"], 222, 150, 20);
  onTop(["VIDEO"], 222, 134, 20);
  k.shell(box(174, 178, -146.6, -146, 100, 116), M.conn, false);
  const panel = extrude(rr(172, -34, 240, 178, 12), -2.5, 0, "front", 1), panelUv = panel.getAttribute("uv");
  for (let i = 0; i < panelUv.count; i++) panelUv.setXY(i, panelUv.getX(i) * 0.06, panelUv.getY(i) * 0.06); // the same size of grain as the grip
  k.shell(panel, M.rubber, false);
  // the name of the little button on top of the grip, lying on the slope beside it
  k.mark(decal(label(["M-Fn"]), 22, 22, { x: -234, y: -124.4, z: -26 }, { x: -1, y: 0, z: 0 }, { x: 0, y: 5, z: -32 }));
  // what each socket is, on the covers at the side
  const onSide = (words: string[], y: number, z: number, size: number) =>
    k.mark(decal(label(words), size, size, { x: 249.9, y, z }, { x: 0, y: 0, z: 1 }, { x: 0, y: -1, z: 0 }));
  onSide(["MIC"], -27, 112, 26);
  onSide(["HDMI"], 52, 112, 26);
  onSide(["USB"], 100, 112, 26);

  // underneath: the tripod thread and the battery door under the grip
  k.shell(ring(11, 22, 183.5, 186.5, "y", 0, 95), M.steel);
  k.shell(extrude(rr(-334, -76, -198, 168, 14), 184.5, 187.5, "top", 1), M.gloss);
  k.shell(box(-290, -250, 187, 189.5, 120, 134), M.body);
  // on the sides: the strap loops, and the covers over the sockets
  k.shell(box(246, 254, -118, -94, 82, 106), M.silver);
  k.shell(box(-358, -350, -118, -94, 82, 106), M.silver);
  k.shell(extrude(rr(40, -64, 150, 10, 10), 245, 249.5, "side", 2), M.rubberPlain);
  k.shell(extrude(rr(40, 22, 150, 128, 10), 245, 249.5, "side", 2), M.rubberPlain);
}

// ---- the cage round the body (dark metal, with rows of threaded holes, no logos). It's one frame that hugs the camera:
// a base plate underneath, a strut up each side, and a top that steps over the viewfinder hump ----
function buildCage(k: Kit) {
  const C = k.M.cage;
  // an outline with other outlines cut out of it (for slots and openings that aren't round)
  const cut = (d: string, ...gaps: string[]) => {
    const s = shapeOf(d);
    for (const g of gaps) s.holes.push(shapeOf(g));
    return s;
  };

  // the base plate, drawn from above: it reaches forward under the grip, has an opening for the battery door,
  // and is scooped out in the middle so the lens clears it
  k.shell(extrude(cut("M -358 -112 L -190 -112 L -150 -44 L -96 -44 Q -76 -44 -66 -20 Q -56 8 -30 8 L 30 8 Q 56 8 66 -20 Q 76 -44 96 -44 L 240 -44 Q 254 -44 254 -30 L 254 170 Q 254 182 242 182 L -358 182 Q -372 182 -372 168 L -372 -98 Q -372 -112 -358 -112 Z",
    rr(-336, -82, -196, 170, 14)), 187, 205, "top", 3,
    [[-150, -10, 6], [-110, -24, 6], [110, -24, 6], [150, -24, 6], [190, -24, 6], [-120, 164, 6], [-70, 164, 6], [60, 164, 6], [110, 164, 6], [160, 164, 6], [210, 164, 6]]), C);
  // the lip that comes up in front of the bottom of the grip
  k.shell(extrude("M -372 205 L -372 152 Q -372 142 -362 142 L -300 142 L -236 166 L -200 166 Q -190 166 -190 176 L -190 205 Z", -112, -99, "front", 3), C);
  // the rail underneath for tripod clamps, and the quick-release plate
  k.shell(extrude("M -31 205 L 168 205 L 180 223 L -43 223 Z", -150, 252, "side"), C);
  k.shell(extrude(rr(-85, 10, 85, 180, 16), 223, 238, "top", 3), C);
  k.shell(cyl(30, 238, 241, "y", 0, 95, 1), k.M.silver);
  k.shell(box(-22, 22, 240.4, 241.6, 91, 99), k.M.gloss);

  // the strut up the grip side, drawn from the side: a wall round the bottom of the grip, a thin bar up the back,
  // then a wide block with holes that meets the top bar (it sits behind the strap loop)
  k.shell(extrude("M 112 -202 L 176 -202 Q 184 -202 184 -194 L 184 -44 L 164 -8 L 164 128 L 184 162 L 184 205 L -112 205 L -112 152 Q -112 142 -102 142 L -64 142 L -30 170 L 112 170 L 136 128 L 136 -8 L 112 -44 Z",
    -372, -352, "side", 3, [[148, -160, 8], [148, -120, 8], [148, -80, 8], [10, 188, 5.5], [60, 188, 5.5]]), C);

  // the strut up the other side. Low down it's a block across the front corner of the body, set at an angle, with a row of holes...
  const corner = extrude(rr(-25, 30, 27, 204, 9), 1, 17, "front", 2.5, [[1, 60, 9], [1, 96, 9], [1, 132, 9], [1, 168, 9]]);
  const c45 = Math.SQRT1_2;
  place(corner, new THREE.Matrix4().set(c45, 0, c45, 237.2, 0, 1, 0, 0, c45, 0, -c45, 8.8, 0, 0, 0, 1));
  k.shell(corner, C);
  // ...then it steps back and carries on up the side, with a slot for a strap and a round socket, to the top of the body
  k.shell(extrude(cut("M 16 205 L 62 205 L 62 44 L 76 14 L 76 -132 Q 76 -146 62 -146 L 2 -146 L 2 -128 L 24 -108 L 30 -4 L 16 30 Z", rr(42, -130, 58, -98, 7)),
    250, 268, "side", 3), C);
  k.shell(ring(8, 15, 268, 271, "x", -56, 53, 1), k.M.steel);
  k.shell(cyl(8, 268, 268.8, "x", -56, 53), k.M.black, false);

  // the top, starting on that side: an arm along the front edge of the body, with a shoe on it for accessories...
  k.shell(extrude("M 99 2 L 254 2 Q 268 2 268 16 L 268 44 L 99 44 Z", -146, -128, "top", 2.5, [[124, 23, 5.5], [150, 23, 5.5]]), C);
  for (const [a, b, c, d] of [[182, 192, -157, -146], [230, 240, -157, -146], [182, 198, -159, -155.5], [224, 240, -159, -155.5]]) k.shell(box(a, b, c, d, 4, 42), C);
  // ...which climbs the side of the viewfinder hump...
  k.shell(extrude("M 102 -128 L 122 -128 L 96 -200 L 76 -200 Z", 2, 44, "front", 2), C);
  // ...to the plate on top of the hump, in front of the flash shoe, with its holes, its screws, and the lip down its front
  k.shell(extrude(rr(-78, -26, 96, 48, 8), -208, -194, "top", 2.5, [[-20, 0, 5], [6, 0, 5], [32, 0, 5], [-20, 26, 5], [6, 26, 5], [32, 26, 5]]), C);
  for (const [x, z] of [[-58, -8], [76, -8], [-58, 32], [76, 32]]) k.shell(cyl(7, -210, -207, "y", x, z, 1), k.M.steel);
  k.shell(extrude(rr(-86, -206, 104, -160, 6), -28, -14, "front", 2.5), C);
  // from there an arm runs back over the dials to a bar above the grip side, which sits on top of the grip-side strut
  k.shell(extrude("M -360 110 L -205 110 L -85 -4 L -68 -4 L -68 40 L -220 184 L -360 184 Q -372 184 -372 172 L -372 122 Q -372 110 -360 110 Z", -202, -182, "top", 3,
    [[-336, 132, 6], [-336, 162, 6], [-296, 132, 6], [-296, 162, 6], [-256, 147, 6]]), C);
}

// one piece of lens glass: zf = where its front is, R = its radius, th = how thick in the middle,
// k1 / k2 = how curved its front and back are (above 0 = the middle bulges towards the front of the lens)
function lensElement(zf: number, R: number, k1: number, th: number, k2: number): [number, number][] {
  const n = 10, p: [number, number][] = [];
  for (let i = 0; i <= n; i++) { const r = (R * i) / n; p.push([zf + k1 * r * r, r]); }
  for (let i = n; i >= 0; i--) { const r = (R * i) / n; p.push([zf + th + k2 * r * r, r]); }
  return p;
}
// The glass inside the kit zoom: 8 pieces in 8 groups, front to back [front, radius, front curve, thickness, back curve].
// The real lens's exact curves aren't published, so this is a sensible layout for a zoom like it, not a copy
const LENS_GLASS: [number, number, number, number, number][] = [
  [-405, 92, 0.0016, 8, 0.003],    // 1: the big front piece (thin in the middle)
  [-352, 70, 0.0022, 34, -0.0018], // 2: fat in the middle
  [-296, 52, -0.002, 7, 0.003],    // 3: thin in the middle
  [-232, 46, 0.003, 24, -0.003],   // 4: just behind the aperture
  [-186, 44, 0.001, 6, 0.004],     // 5: the piece that moves to steady the picture
  [-150, 50, 0.0025, 22, -0.002],  // 6
  [-100, 52, -0.0015, 6, 0.003],   // 7: the piece that moves to focus
  [-44, 66, 0.0012, 22, -0.0006],  // 8: the back piece, nearest the sensor
];
const LENS_APERTURE_Z = -252;

// ---- the lens (the 24-50mm kit zoom, pulled out ready to shoot, with its hood on backwards, a step-up ring and a wide filter stack; no writing but the zoom numbers) ----
function buildLens(k: Kit) {
  const { M } = k, X = LENS_X, Y = LENS_Y;
  const L = (prof: [number, number][], m: THREE.Material, lines = true) => k.shell(lathe(prof, "z", X, Y), m, lines);
  // the back of the barrel, widening from the mount, and a black wall so you can't see daylight through the lens
  L([[-12, 128], [-12, 142], [-26, 156], [-112, 157], [-112, 128]], M.barrel);
  k.shell(cyl(128, -15, -13, "z", X, Y), M.black, false);
  // the zoom ring (ridged rubber), a thin metal ring, then the diamond-knurled control ring
  L([[-112, 140], [-112, 156.8], [-196, 156.8], [-196, 140]], M.barrel, false);
  k.shell(ribbed(160, 3, 90, -195, -113, "z", X, Y), M.ribs, false);
  L([[-196, 140], [-196, 158.5], [-201, 158.5], [-201, 140]], M.dimSilver);
  L([[-201, 140], [-201, 157], [-250, 157], [-250, 140]], M.barrel, false);
  k.shell(knurled(160.2, 2.6, 96, 7, -249, -202, "z", X, Y), M.ribs, false);
  L([[-250, 128], [-250, 157], [-256, 157], [-262, 150], [-262, 128]], M.barrel);
  // the inner barrel that slides out a long way when the lens is ready to shoot, and its front with the ring round the glass
  L([[-260, 118], [-260, 131], [-395, 131], [-395, 118]], M.barrel);
  L([[-395, 118], [-395, 131], [-401, 142], [-417, 142], [-417, 130], [-411, 128], [-411, 96], [-403, 96], [-403, 118]], M.barrel);
  // the switches on the side, near the body
  k.shell(box(146, 158.5, Y - 60, Y + 50, -106, -42), M.barrel);
  const lensSwitch = (y: number, words: string[]) => {
    // the label, the slot the switch slides in, the switch itself, and the white line on it
    k.mark(decal(label(words), 30, 30, { x: 158.9, y: y - 19, z: -74 }, { x: 0, y: 0, z: 1 }, { x: 0, y: -1, z: 0 }));
    k.shell(box(158.5, 159.3, y - 3, y + 13, -92, -56), M.black, false);
    k.shell(box(158.5, 162.5, y - 1, y + 11, -90, -70), M.gloss);
    k.shell(box(162.5, 162.9, y, y + 10, -81, -79), M.conn, false);
  };
  lensSwitch(Y - 22, ["CONTROL", "AF | MF"]);
  lensSwitch(Y + 32, ["STABILIZER", "ON | OFF"]);
  // the zoom numbers along the top, read from behind the camera
  const a0 = -0.62, a1 = 0.62, zr = -58, zf = -106, cols = 16;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= cols; i++) {
    const a = a0 + ((a1 - a0) * i) / cols;
    for (const [z, v] of [[zr, 0], [zf, 1]]) {
      pos.push(X + 157.6 * Math.sin(a), Y - 157.6 * Math.cos(a), z);
      uv.push(1 - i / cols, v);
    }
    if (i < cols) { const b = i * 2; idx.push(b, b + 1, b + 3, b, b + 3, b + 2); }
  }
  const band = new THREE.BufferGeometry();
  band.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  band.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  band.setIndex(idx);
  band.computeVertexNormals();
  k.mark(new THREE.Mesh(band, new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    map: drawnTexture(1024, 256, (c, w) => {
      c.fillStyle = "#e9e9e9";
      c.font = "600 84px Arial, Helvetica, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      ["24", "28", "35", "50"].forEach((n, i) => c.fillText(n, w * (0.2 + i * 0.2), 150));
      c.fillRect(w / 2 - 4, 20, 8, 56);
    }),
  })));

  // The hood, put on backwards (how it's stored): a short, nearly straight sleeve clipped to the very front of the
  // lens and pointing back towards the body, standing clear of the inner barrel. Its two wide petals are on the
  // sides; at the top and bottom a deep U is cut out, where you can see the inner barrel behind it.
  L([[-417, 141], [-417, 158], [-401, 160], [-401, 141]], M.barrel);
  k.shell(surface(144, 14, (u, v) => {
    const a = u * Math.PI * 2, back = -272 - 66 * smooth(0.66, 0.985, Math.abs(Math.sin(a))), z = -409 + (back + 409) * v;
    return around("z", X, Y, z, 160 + 12 * ((z + 409) / 137), a);
  }, true, { x: X, y: Y, z: -340 }), M.barrelSoft, false);
  // the step-up ring: screwed into the lens's own thread, it steps out to the size of the bigger filter
  L([[-413, 126], [-417, 131], [-423, 186], [-431, 186], [-431, 178], [-425, 126]], M.cage);
  // the stack on the front of it: a ring with square teeth, a diamond-knurled ring, then the filter itself
  L([[-431, 178], [-431, 189], [-445, 189], [-445, 178]], M.barrel, false);
  k.shell(ribbed(194, 5, 46, -444, -432, "z", X, Y), M.cage, false);
  L([[-445, 178], [-445, 190.5], [-459, 190.5], [-459, 178]], M.barrel, false);
  k.shell(knurled(193.6, 2.2, 120, 2, -458, -446, "z", X, Y), M.cage, false);
  L([[-459, 181], [-459, 195], [-475, 195], [-477, 193], [-477, 181]], M.barrel);
  k.shell(ribbed(196.2, 1.2, 150, -475, -467, "z", X, Y), M.ribs, false);
  k.glass(cyl(182, -470, -468, "z", X, Y), M.filterGlass);

  // the glass, and the aperture blades (you can see them down the barrel from the front)
  for (const [z, R, k1, th, k2] of LENS_GLASS) k.glass(lathe(lensElement(z, R, k1, th, k2), "z", X, Y, 64), M.lensGlass);
  const N = CAMERA_APERTURE_BLADES, open = 30, out = 60;
  for (let i = 0; i < N; i++) {
    const b0 = 0.3 + (i / N) * Math.PI * 2, b1 = 0.3 + ((i + 1) / N) * Math.PI * 2, s = new THREE.Shape();
    s.moveTo(X + open * Math.cos(b0), Y + open * Math.sin(b0));
    s.lineTo(X + open * Math.cos(b1), Y + open * Math.sin(b1));
    for (let q = 0; q <= 8; q++) { const a = b1 + 0.4 - (q / 8) * 1.7; s.lineTo(X + out * Math.cos(a), Y + out * Math.sin(a)); }
    s.closePath();
    k.glass(extrude(s, LENS_APERTURE_Z + i * 0.9, LENS_APERTURE_Z + i * 0.9 + 0.8), M.blade);
  }
}

// ---- inside the lens (seen in x-ray view) ----
function buildLensInsides(k: Kit) {
  const { M } = k, X = LENS_X, Y = LENS_Y;
  // the ring that holds each piece of glass
  for (const [z, R, k1, th, k2] of LENS_GLASS) {
    const e0 = z + k1 * R * R, e1 = z + th + k2 * R * R;
    k.inside(ring(R - 1, R + 7, Math.min(e0, e1) - 2, Math.max(e0, e1) + 2, "z", X, Y, 1.5, 64), M.cell);
  }
  // the aperture's housing and the little motor that turns it
  k.inside(ring(60, 82, LENS_APERTURE_Z - 4, LENS_APERTURE_Z + 10, "z", X, Y, 2), M.frame);
  k.inside(cyl(8, LENS_APERTURE_Z - 16, LENS_APERTURE_Z - 4, "z", X + 66, Y - 26), M.can);
  // the image stabiliser round piece 5: a plate, two coils of copper wire and their magnets
  const IS = LENS_GLASS[4][0];
  k.inside(ring(52, 88, IS + 6, IS + 14, "z", X, Y, 1.5), M.frame);
  for (const a of [-Math.PI / 4, (-3 * Math.PI) / 4]) {
    const cx = X + 70 * Math.cos(a), cy = Y + 70 * Math.sin(a);
    k.inside(box(cx - 14, cx + 14, cy - 14, cy + 14, IS - 3, IS + 6), M.copper);
    k.inside(box(cx - 16, cx + 16, cy - 16, cy + 16, IS + 14, IS + 20), M.can);
  }
  // the focus motor: a small motor turning a screw, which slides piece 7 along two rods
  const FOCUS = LENS_GLASS[6][0];
  k.inside(cyl(10, -40, -16, "z", X - 68, Y + 68, 1), M.can);
  k.inside(cyl(2.6, FOCUS - 30, -40, "z", X - 68, Y + 68), M.steel);
  k.inside(box(X - 78, X - 58, Y + 58, Y + 78, FOCUS - 6, FOCUS + 6), M.chip);
  k.inside(box(X - 62, X - 40, Y + 40, Y + 62, FOCUS - 3, FOCUS + 3), M.frame);
  k.inside(cyl(2.4, FOCUS - 34, -18, "z", X + 74, Y + 48), M.steel);
  k.inside(cyl(2.4, FOCUS - 34, -18, "z", X + 8, Y - 88), M.steel);
  // the lens's own circuit board (a C-shaped ring near the mount), its chips, and the ribbon cable running forward
  const arc = (r0: number, r1: number, from: number, to: number) => {
    const s = new THREE.Shape();
    s.absarc(X, Y, r1, from, to, false);
    s.absarc(X, Y, r0, to, from, true);
    s.closePath();
    return s;
  };
  k.inside(extrude(arc(90, 124, (120 * Math.PI) / 180, (420 * Math.PI) / 180), -24, -21), M.pcb);
  k.inside(box(X - 22, X + 22, Y - 120, Y - 96, -29, -24), M.chip);
  k.inside(box(X + 70, X + 90, Y - 84, Y - 64, -27, -24), M.chip);
  k.inside(box(X - 96, X - 78, Y - 70, Y - 52, -27, -24), M.chip);
  k.inside(box(X - 106, X - 102, Y - 18, Y + 18, -250, -24), M.flex);
  k.inside(box(146, 150, Y - 30, Y + 30, -100, -48), M.pcb);
  // the gold pins that talk to the camera, at the bottom of the mount
  k.inside(extrude(arc(106, 126, (55 * Math.PI) / 180, (125 * Math.PI) / 180), -20, -12), M.chip);
  for (let i = 0; i < 12; i++) {
    const a = ((62 + i * 5.1) * Math.PI) / 180;
    k.inside(cyl(2.6, -12, -3, "z", X + 116 * Math.cos(a), Y + 116 * Math.sin(a), 0, 12), M.gold);
  }
}

// ---- inside the body (seen in x-ray view) ----
function buildBodyInsides(k: Kit) {
  const { M } = k, Y = LENS_Y;
  // behind the mount: the shutter (its frame, two of its blades part way down, and its motor)...
  const frame = shapeOf(rr(-118, Y - 88, 118, Y + 88, 6));
  frame.holes.push(new THREE.Path(shapeOf(rr(-83, Y - 56, 83, Y + 56, 2)).getPoints(4)));
  k.inside(extrude(frame, 44, 56), M.chip);
  k.inside(box(-83, 83, Y - 56, Y - 34, 47, 48.5), M.frame);
  k.inside(box(-83, 83, Y - 38, Y - 20, 49.5, 51), M.frame);
  k.inside(cyl(12, 44, 72, "z", 140, Y + 70, 1), M.can);
  // ...then the full-frame sensor on its own board
  k.inside(box(-81, 81, Y - 54, Y + 54, 71, 75), M.sensor);
  k.inside(box(-96, 96, Y - 68, Y + 68, 75, 82), M.ceramic);
  k.inside(extrude(rr(-125, Y - 92, 125, Y + 92, 6), 82, 86), M.pcb);
  // the main board behind it, with the processor, memory and the rest (they face the back of the camera)
  k.inside(extrude("M -140 -100 L 205 -100 L 215 -90 L 215 150 L 205 160 L -60 160 L -60 100 L -140 100 Z", 118, 122), M.pcb);
  k.inside(box(30, 95, 5, 70, 122, 128), M.chip);
  k.inside(box(38, 87, 13, 62, 128, 128.7), M.chipTop);
  k.inside(box(115, 160, 0, 60, 122, 127), M.chip);
  k.inside(box(40, 80, 95, 140, 122, 126.5), M.chip);
  k.inside(box(-125, -45, -80, 10, 122, 131), M.can);
  for (const [x, y, s] of [[-20, -70, 18], [20, -60, 14], [120, 90, 20], [165, 100, 14], [-30, 40, 16], [-110, 50, 22], [-20, 110, 16], [175, -40, 16], [100, -70, 24]]) {
    k.inside(box(x - s / 2, x + s / 2, y - s / 2, y + s / 2, 122, 125.5), M.chip);
  }
  for (const y of [-88, -20, 60]) k.inside(box(176, 208, y, y + 14, 122, 129), M.conn);
  for (let i = 0; i < 12; i++) k.inside(cyl(2.4, 122, 123, "z", 118 + (i % 4) * 11, 125 + Math.floor(i / 4) * 10, 0, 10), M.gold);
  for (let i = 0; i < 14; i++) {
    const x = -130 + ((i * 97) % 330), y = -90 + ((i * 61) % 240);
    k.inside(box(x, x + 9, y, y + 5, 122, 125), i % 3 ? M.ceramic : M.brass);
  }
  // the battery in the grip, and the memory card beside it
  k.inside(box(-334, -204, -30, 180, -60, -2), M.battery);
  k.inside(box(-316, -222, 60, 130, -61.2, -60), M.paper);
  k.inside(box(-300, -240, -34, -30, -44, -18), M.gold);
  k.inside(box(-330, -222, 40, 176, 22, 31), M.card);
  k.inside(box(-324, -228, 52, 120, 20.8, 22), M.paper);
  k.inside(box(-334, -218, 30, 180, 31, 33), M.can);
  // the electronic viewfinder in the hump: a tiny screen, and the glass you look at it through
  k.inside(box(-18, 30, -137, -105, 96, 99), M.oled);
  k.inside(box(-26, 38, -145, -97, 92, 96), M.pcb);
  for (const [z, R, k1, th, k2] of [[112, 24, 0.008, 10, -0.008], [138, 26, 0.004, 8, 0.002], [160, 28, 0.006, 12, -0.004]]) {
    k.glass(lathe(lensElement(z, R, k1, th, k2), "z", 6, -121, 40), M.lensGlass);
    k.inside(ring(R, R + 4, z + 2, z + th - 2, "z", 6, -121, 1, 40), M.cell);
  }
  // under the top: the parts the dials and buttons turn or press, and the ribbon cables joining them up
  k.inside(box(-170, -110, -122, -120, 60, 130), M.flex);
  k.inside(cyl(14, -126, -110, "y", -140, 95), M.can);
  k.inside(cyl(14, -126, -112, "y", -272, 124), M.can);
  k.inside(box(-292, -272, -108, -96, -70, -50), M.can);
  k.inside(cyl(8, -34, -18, "z", -298, -122), M.can);
  k.inside(box(-20, 32, -191, -184, 100, 150), M.chip);
  k.inside(box(-6, 18, -186, -100, 148, 150), M.flex);
  k.inside(box(196, 212, 40, 90, 124, 182), M.flex);
  // the metal thread for a tripod, and the sockets on the side (USB, HDMI, microphone, headphones) on their board
  k.inside(cyl(17, 150, 185, "y", 0, 95, 1), M.brass);
  k.inside(box(210, 214, -50, 125, 60, 130), M.pcb);
  k.inside(box(214, 244, -34, -22, 80, 112), M.can);
  k.inside(box(214, 244, 28, 42, 76, 114), M.can);
  k.inside(cyl(8, 214, 244, "x", 78, 95), M.can);
  k.inside(cyl(8, 214, 244, "x", 108, 95), M.can);
}

// everything that makes up the camera. To add another model later (a flash, say), write its function and add it here
const CAMERA_PARTS: ((k: Kit) => void)[] = [buildBody, buildCage, buildLens, buildLensInsides, buildBodyInsides];

// soft studio lighting for the camera to reflect: a pale room with a few bright panels, like softboxes
function studioLight(renderer: THREE.WebGLRenderer) {
  const s = new THREE.Scene();
  const made: { geometry: THREE.BufferGeometry; material: THREE.Material }[] = [];
  const add = (g: THREE.BufferGeometry, power: number, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power, power), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    s.add(m);
    made.push(m);
  };
  add(new THREE.BoxGeometry(24, 14, 24), 0.45);
  add(new THREE.PlaneGeometry(9, 6), 11, -6, 5, 7);   // the main light: big, up and to the left, in front
  add(new THREE.PlaneGeometry(3, 9), 5, 9, 1, 3);     // a tall strip to the right
  add(new THREE.PlaneGeometry(10, 3), 4, 0, 6, -5);   // one behind, along the top
  add(new THREE.PlaneGeometry(6, 2), 2.5, 0, -6, 4);  // a little bounce from below
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.04).texture;
  pm.dispose();
  made.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
  return tex;
}

// Sets the camera up on a canvas. render = draw it in a pose. xray = how far into x-ray view it is (0 to 1).
// paintDots = redraw the dots on its back screen.
function makeCameraStage(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const env = studioLight(renderer);
  scene.environment = env;
  scene.environmentIntensity = 0.7;
  const cam = new THREE.PerspectiveCamera(30, 1, 100, 10000);

  // build the model
  const root = new THREE.Group(), shell = new THREE.Group(), inside = new THREE.Group(), glass = new THREE.Group(), marks = new THREE.Group(), lines = new THREE.Group();
  root.add(shell, inside, glass, marks, lines);
  root.matrixAutoUpdate = false;
  const M = cameraMaterials();
  const solid = (into: THREE.Group, shadows: boolean) => (g: THREE.BufferGeometry, m: THREE.Material, edges = true) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    mesh.userData.edges = edges;
    into.add(mesh);
    return mesh;
  };
  const kit: Kit = { M, shell: solid(shell, true), inside: solid(inside, true), glass: solid(glass, false), mark: (mesh) => { marks.add(mesh); } };
  CAMERA_PARTS.forEach((part) => part(kit));
  // aperture blades are solid metal, so they do take part in the shadows
  glass.children.forEach((c) => { if ((c as THREE.Mesh).material === M.blade) c.castShadow = c.receiveShadow = true; });
  inside.visible = false;
  // the attachment points, as named (invisible) points on the model
  for (const [name, at] of Object.entries(CAMERA_ANCHORS)) {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(at.x, at.y, at.z);
    root.add(o);
  }
  scene.add(root);

  // the back screen's dots: a picture that's redrawn as they light up
  const DOT_PX = 3;
  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = SCREEN_W * DOT_PX;
  dotCanvas.height = SCREEN_H * DOT_PX;
  const dotCtx = dotCanvas.getContext("2d");
  const dotTex = new THREE.CanvasTexture(dotCanvas);
  dotTex.colorSpace = THREE.SRGBColorSpace;
  const dotMesh = decal(dotTex, SCREEN_W, SCREEN_H, { x: SCREEN_X, y: SCREEN_Y, z: SCREEN_Z - 0.2 }, { x: -1, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
  (dotMesh.material as THREE.MeshBasicMaterial).toneMapped = false;
  root.add(dotMesh);

  // lights: one main light that casts the shadows, and a soft one from the other side
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(-1100, 1500, 1700);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -1000;
  sc.right = sc.top = 1000;
  sc.near = 400;
  sc.far = 4800;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 2.5;
  const fill = new THREE.DirectionalLight(0xffffff, 1.1);
  fill.position.set(1400, 300, 900);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(900, 900, -1500);
  scene.add(key, key.target, fill, rim);

  // x-ray view: everything on the outside turns to a faint ghost with fine lines round its edges, and the insides show
  const shellMats = Array.from(new Set(shell.children.map((c) => (c as THREE.Mesh).material as THREE.Material)));
  const markMats = marks.children.map((c) => (c as THREE.Mesh).material as THREE.Material);
  const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(`rgb(${CAMERA_XRAY_LINES})`), transparent: true, opacity: 0, depthWrite: false });
  const GLASS_DARK = new THREE.Color(0x0a0f14), GLASS_PALE = new THREE.Color(0xa9d6ee);
  let xrayNow = -1, linesBuilt = false;
  const setXray = (a: number) => {
    if (a === xrayNow) return;
    const ghost = a > 0.002, was = xrayNow > 0.002;
    xrayNow = a;
    if (ghost && !linesBuilt) {
      linesBuilt = true;
      shell.children.forEach((c) => {
        const mesh = c as THREE.Mesh;
        if (mesh.userData.edges) lines.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 28), lineMat));
      });
    }
    for (const m of shellMats) {
      m.opacity = 1 + (CAMERA_XRAY_GHOST - 1) * a;
      m.depthWrite = a < 0.5;
      if (ghost !== was || m.transparent !== ghost) { m.transparent = ghost; m.needsUpdate = true; }
    }
    shell.children.forEach((c) => { c.castShadow = a < 0.5; });
    for (const m of markMats) m.opacity = 1 - a;
    // lens glass: dark with coloured reflections when solid, pale blue so you can see each piece in x-ray
    M.lensGlass.color.lerpColors(GLASS_DARK, GLASS_PALE, a);
    M.lensGlass.opacity = 0.2 + 0.16 * a;
    lineMat.opacity = 0.55 * a;
    lines.visible = ghost;
    inside.visible = ghost;
  };
  setXray(0);

  let dotsKey = "";
  const paintDots = (lit: Float32Array, show: number, version: number) => {
    const k = `${version}|${show.toFixed(3)}|${xrayNow.toFixed(2)}`;
    if (k === dotsKey || !dotCtx) return;
    dotsKey = k;
    const D = CAMERA_SCREEN_DOTS, a = show * (1 - Math.max(0, xrayNow));
    dotCtx.clearRect(0, 0, dotCanvas.width, dotCanvas.height);
    dotMesh.visible = a > 0.003;
    if (!dotMesh.visible) return;
    const x0 = SCREEN_X + SCREEN_W / 2, y0 = SCREEN_Y - SCREEN_H / 2, base = CAMERA_DOT_GAP * 0.3 * DOT_PX;
    dotCtx.fillStyle = `rgba(${CAMERA_DOTS},${(CAMERA_DOT_FAINT * 2.2 * a).toFixed(3)})`;
    for (let i = 0; i < D.length; i++) if (lit[i] <= 0) dotCtx.fillRect((x0 - D[i].x) * DOT_PX - base / 2, (D[i].y - y0) * DOT_PX - base / 2, base, base);
    for (let i = 0; i < D.length; i++) {
      const v = lit[i];
      if (v <= 0) continue;
      const g = base * (1.2 + 0.6 * v);
      dotCtx.fillStyle = `rgba(${CAMERA_DOTS_LIT},${((0.35 + 0.65 * v) * a).toFixed(3)})`;
      dotCtx.fillRect((x0 - D[i].x) * DOT_PX - g / 2, (D[i].y - y0) * DOT_PX - g / 2, g, g);
    }
    dotTex.needsUpdate = true;
  };

  let sizeKey = "";
  const render = (o: CameraPose, w: number, h: number, dpr: number) => {
    const sk = `${w}x${h}@${dpr}`;
    if (sk !== sizeKey) {
      sizeKey = sk;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
    }
    // the same view as poseProjector, so the page's screen box lines up with the model's screen exactly
    const cY = Math.cos(o.yaw), sY = Math.sin(o.yaw), cT = Math.cos(o.tilt), sT = Math.sin(o.tilt), cR = Math.cos(o.roll), sR = Math.sin(o.roll);
    const r = [
      [cY * cR - sY * sT * sR, -cT * sR, sY * cR + cY * sT * sR],
      [-(cY * sR + sY * sT * cR), -cT * cR, -(sY * sR - cY * sT * cR)],
      [sY * cT, -sT, -cY * cT],
    ];
    const t = r.map((row) => -(row[0] * o.px + row[1] * o.py + row[2] * o.pz));
    root.matrix.set(r[0][0], r[0][1], r[0][2], t[0], r[1][0], r[1][1], r[1][2], t[1], r[2][0], r[2][1], r[2][2], t[2], 0, 0, 0, 1);
    root.updateMatrixWorld(true);
    const F = o.depth;
    cam.position.set(0, 0, F);
    cam.aspect = w / h;
    cam.fov = (2 * Math.atan(h / (2 * o.scale * F)) * 180) / Math.PI;
    cam.near = Math.max(50, F - 1700);
    cam.far = F + 1700;
    cam.setViewOffset(w, h, w / 2 - o.cx, h / 2 - o.cy, w, h);
    cam.updateProjectionMatrix();
    renderer.render(scene, cam);
  };

  const dispose = () => {
    root.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
    [...Object.values(M), ...markMats, lineMat, dotMesh.material as THREE.Material].forEach((m) => {
      const map = (m as THREE.MeshBasicMaterial).map;
      if (map) map.dispose();
      m.dispose();
    });
    M.rubber.bumpMap?.dispose();
    env.dispose();
    renderer.dispose();
  };
  return { render, setXray, paintDots, dispose };
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
  // x-ray view: the switch, whether it's on (for the page) and the same for the drawing loop
  const xrayBtnRef = useRef<HTMLButtonElement>(null);
  const xrayRef = useRef(false);
  const [xray, setXray] = useState(false);
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
  const [albums, setAlbums] = useState<{ id: string; title: string; description: string; cover: string; count: number; taken: string }[]>([]);
  useEffect(() => {
    let gone = false;
    fetch("/api/albums").then((r) => (r.ok ? r.json() : [])).then((a) => { if (!gone) setAlbums(a); }).catch(() => {});
    return () => { gone = true; };
  }, []);
  // the albums to show: any named in HOME_ALBUMS first, then the most recently shot, three in all (newest first)
  const byNewest = [...albums].sort((a, b) => (b.taken || "").localeCompare(a.taken || ""));
  const featured = [
    ...HOME_ALBUMS.map((n) => albums.find((a) => a.id === n)).filter((a): a is (typeof albums)[number] => !!a),
    ...byNewest.filter((a) => !HOME_ALBUMS.includes(a.id)),
  ].slice(0, 3);

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

  // The camera. At the start you can drag it round to look at it from any side (it also leans a little towards
  // the mouse and sways gently). As you scroll, it turns round to show its back and zooms in on the screen there
  // (on phones held upright it also tips on its side, so the screen stands up tall). Then the screen's pages
  // (who am i, photos, videos, projects, contact) slide past one at a time as you keep scrolling. You can also
  // swipe or drag them sideways, press the left and right arrow keys, or tap the dots.
  useEffect(() => {
    const box = camRef.current, cv = camCanvasRef.current, hint = camHintRef.current;
    const scr = screenRef.current, track = screenTrackRef.current;
    const xrayBtn = xrayBtnRef.current;
    if (!box || !cv || !scr || !track) return;
    // the 3D camera (if the browser can't do 3D, the rest of the page still works without it)
    let stage: ReturnType<typeof makeCameraStage> | null = null;
    try { stage = makeCameraStage(cv); } catch { stage = null; }
    let xr = 0; // how far into x-ray view it is (0 = solid, 1 = see-through)
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
    let turnDir = 0; // which way round it turns to its screen (+1 / -1), fixed once the turn has started
    const START = CAMERA_TURN * CAMERA_SPIN_UNTIL; // you can turn it until you've scrolled this far (1 = the whole camera part)
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
      drawnKey = ""; // draw again at the new size
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
      // While you can still drag it, scrolling turns it half way round from wherever you've turned it (so you can spin it
      // all the way round without it jumping). Past that point it stops following the pointer, and the rest of the scroll
      // eases it round to face you with its screen, going whichever way is shorter.
      const toBack = Math.PI - yaw0;
      let shortest = Math.atan2(Math.sin(toBack), Math.cos(toBack));
      if (f <= 0.001 || !turnDir) turnDir = shortest < 0 ? -1 : 1;
      if (Math.abs(shortest - turnDir * Math.PI) > Math.PI) shortest += Math.sign(turnDir * Math.PI - shortest) * Math.PI * 2;
      const turnBy = lerp(turnDir * Math.PI, shortest, smooth(smooth(0, T, START), 0.75, f));

      // Lighting up the dots: every dot near the line the pointer moved along since the last frame lights up
      // (so fast moves don't skip any). Once you scroll on towards the screen, they all fade away.
      const dotShow = 1 - smooth(0.12, 0.55, f);
      // x-ray view fades in and out when you flip the switch
      const xrGoal = xrayRef.current ? 1 : 0;
      xr += (xrGoal - xr) * (1 - Math.exp(-dt * 7));
      if (Math.abs(xrGoal - xr) < 0.004) xr = xrGoal;
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
        const pose: CameraPose = {
          yaw: yaw0 + turnBy * turn + (ex * CAMERA_MOUSE + Math.sin(t * 0.6) * 1.5) * wob * deg,
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
          [pose.scale, pose.px, pose.py, pose.pz, pose.depth].map((v) => v.toFixed(4)).join(",") +
          `|${pose.cx.toFixed(1)},${pose.cy.toFixed(1)},${w},${h}|${dotShow.toFixed(3)},${dotVer},${xr.toFixed(3)}`;
        if (key !== drawnKey || !drawnBox) {
          drawnKey = key;
          drawnBox = screenBoxFor(pose);
          // where each of the screen's dots is on the page, for the pointer to find them
          const proj = poseProjector(pose);
          for (let i = 0; i < D.length; i++) {
            const q = proj(D[i]);
            dotXY[i * 2] = q.x;
            dotXY[i * 2 + 1] = q.y;
          }
          if (stage) {
            stage.setXray(xr);
            stage.paintDots(dotLit, dotShow, dotVer);
            stage.render(pose, w, h, dpr);
          }
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
          el.style.background = i === page ? "rgb(255,255,255)" : "rgba(255,255,255,.25)";
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
      // the x-ray switch is there while you can see the whole camera, and goes as it zooms in on the screen
      if (xrayBtn) {
        const o = 1 - smooth(0.25, 0.5, f);
        xrayBtn.style.opacity = String(o);
        xrayBtn.style.pointerEvents = o > 0.5 ? "auto" : "none";
        xrayBtn.style.visibility = o < 0.01 ? "hidden" : "visible";
      }
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
      stage?.dispose();
    };
  }, []);

  // sizes for the writing on the camera's screen: they grow with the screen (cqmin = 1% of its shorter side)
  const scrTitle: CSSProperties = { fontSize: "clamp(1.35rem, 7cqmin, 3.75rem)" };
  const scrText: CSSProperties = { fontSize: "clamp(0.8rem, 2.5cqmin, 1.3rem)" };
  const scrSmall: CSSProperties = { fontSize: "clamp(0.7rem, 1.9cqmin, 1rem)" };
  const scrPad: CSSProperties = { padding: "clamp(14px, 5cqmin, 48px)", paddingTop: "clamp(10px, 3cqmin, 28px)" };

  return (
    <main className="relative" style={{ background: `rgb(${PAGE_BG})`, color: `rgb(${PAGE_INK})` }}>

      {/* the page's main heading: screen readers and Google read it, it isn't shown */}
      <h1 className="sr-only">Ethan Wang: photography, and a bit about me</h1>

      {/* dot + trailing ring cursor */}
      <Cursor />

      <style>{INTRO_CSS + LENIS_CSS + CURSOR_CSS + MARKER_CSS + CONTACT_CSS + BG_CSS}</style>

      {/* The camera. Scrolling through this tall block turns it round and zooms in on its back
          screen. Then the screen's pages slide past: who am i, photos, videos, projects and contact
          (edit ABOUT_TITLE, ABOUT_TEXT, ABOUT_PRO, ABOUT_PERSONAL, HOME_ALBUMS, HOME_VIDEO, HOME_PROJECTS and CONTACT_TEXT at the top). */}
      <section ref={camRef} className="relative -mt-16" style={{ height: CAMERA_HEIGHT }}>
        <div className="sticky top-0 z-10 h-dvh w-full overflow-hidden">
          <canvas key="camera-3d" ref={camCanvasRef} role="img" aria-label="A 3D model of my camera. Drag to turn it." className="absolute inset-0 h-full w-full" style={{ touchAction: "pan-y" }} />

          {/* the camera's back screen: laid exactly over the screen in the drawing once it's zoomed in */}
          <div
            ref={screenRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="the camera's screen"
            className="absolute flex select-none flex-col overflow-hidden rounded-[2px] text-white"
            style={{
              left: 0, top: 0, width: 0, height: 0, opacity: 0, visibility: "hidden",
              containerType: "size", touchAction: "pan-y",
              background: "#000",
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
                      fill={battery && battery.level <= 0.2 && !battery.charging ? "rgb(255,95,95)" : "rgb(255,255,255)"}
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
                      // colour ABOUT_CIRCLE (the first time it comes up) blue and circle it in blue, like with a marker
                      const at = ABOUT_CIRCLE ? paragraph.indexOf(ABOUT_CIRCLE) : -1;
                      if (at < 0) return <p key={i}>{paragraph}</p>;
                      return (
                        <p key={i}>
                          {paragraph.slice(0, at)}
                          <span className="marker" style={{ color: `rgb(${MARKER_BLUE})` }}>
                            {ABOUT_CIRCLE}
                            {/* a loop drawn in one stroke that runs a little past where it started, like a real marker */}
                            <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                              <path
                                d="M 22 7 C 48 -1, 90 1, 96 17 C 101 31, 66 39, 42 37.5 C 16 36, 1 28, 5 16 C 8 7, 28 2.5, 58 4.5"
                                pathLength={1}
                                fill="none"
                                stroke={`rgb(${MARKER_BLUE})`}
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
                    {albums.length > 0 ? `${albums.length} albums so far! the latest three:` : "albums from my camera roll."}
                  </p>
                  <div className="mt-[1em] grid min-h-0 flex-1 grid-cols-3 gap-[clamp(8px,2cqmin,20px)]">
                    {featured.map((a) => (
                      <Link key={a.id} href={`/photos/${encodeURIComponent(a.id)}`} draggable={false} className="group relative block min-h-0 overflow-hidden rounded-[3px] bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                        {(HOME_COVERS[a.id] || a.cover) && (
                          <Image
                            src={HOME_COVERS[a.id] ? `/photos/${encodeURIComponent(a.id)}/${encodeURIComponent(HOME_COVERS[a.id].photo)}` : a.cover}
                            alt={`${a.title}: album cover`}
                            fill
                            sizes="(min-width: 768px) 28vw, 30vw"
                            draggable={false}
                            className="object-cover transition duration-700 group-hover:scale-[1.04]"
                            style={{ objectPosition: HOME_COVERS[a.id]?.focus || "50% 50%" }}
                          />
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
                          <dd className="leading-snug text-neutral-400">
                            {row.links
                              ? row.links.map((l, j) => (
                                  <span key={l.href}>
                                    {j > 0 && ", "}
                                    <a href={l.href} target="_blank" rel="noopener noreferrer" draggable={false} className="underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white">{l.label}</a>
                                  </span>
                                ))
                              : row.text}
                          </dd>
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

          {/* the x-ray switch: see inside the body and the lens */}
          <button
            ref={xrayBtnRef}
            type="button"
            role="switch"
            aria-checked={xray}
            onClick={() => { xrayRef.current = !xrayRef.current; setXray(xrayRef.current); }}
            className="absolute bottom-7 right-5 flex items-center gap-3 rounded-full px-3 py-2 text-sm font-light lowercase text-neutral-500 sm:right-[5%]"
          >
            x-ray
            <span className="relative block h-5 w-9 rounded-full transition-colors duration-300" style={{ background: xray ? `rgb(${BLUE})` : "rgba(0,0,0,.18)" }}>
              <span className="absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform duration-300" style={{ transform: xray ? "translateX(16px)" : "none" }} />
            </span>
          </button>

          <div ref={camHintRef} className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-light lowercase text-neutral-500">
            drag to turn/scroll
          </div>
        </div>
      </section>

      {/* plain one-line footer: grey monospace, lowercase, links with a faint underline */}
      <footer className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-6 font-mono text-sm lowercase text-neutral-500">
        <span>© 2026 ethan wang</span>
        {/* your resume page (app/resume/page.tsx) */}
        <Link href="/resume" className="border-b border-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-800">résumé</Link>
        <Link href="/contact" className="border-b border-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-800">contact me</Link>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="border-b border-neutral-300 lowercase transition-colors hover:border-neutral-500 hover:text-neutral-800"
        >
          back to top
        </button>
      </footer>
    </main>
  );
}