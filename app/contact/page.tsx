"use client";
// app/contact/page.tsx  (the page the "Contact me" button on the home page opens; everything for it lives in this one file)
// The form is a flat, drawn airmail postcard: a striped border, a stamp with a plane on it, a blue label and a postmark.
// The front says hi; you write your message on the back. When it's sent, a postmark stamps onto it and it flies off.

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import * as THREE from "three";
import { createPortal } from "react-dom";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";

// ---- Contact page: edit these ----
const EMAIL = "ethan@wingwang.ca"; // shown on the page. (Messages from the form are delivered to the address inside app/api/contact/route.ts)
const CONTACT_TITLE = "contact";
const CONTACT_BLURB = "write me a postcard. tell me a little about what you're working on and i'll get back to you soon.";
const PHONE: string = ""; // optional, for example "647-555-0123". Leave it empty to hide the phone line
// your links (the same ones as in the navbar). Any with an empty link "" is hidden
const SOCIALS: { label: string; href: string }[] = [
  { label: "instagram", href: "https://instagram.com/etnwingwang" },
  { label: "linkedin", href: "https://www.linkedin.com/in/ethan-wang-9206563a1/" },
];

// ---- the postcard: edit these ----
const POSTCARD_CAPTION = "say hi!";            // written big on the front
const LABEL_TEXT = "wingwang";                 // on the blue label
const LABEL_SMALL = "airmail";                 // the small line under it
const POSTMARK_TEXT = "wingwang * toronto * "; // round the edge of the postmark
const FLIP_SECONDS = 0.8; // how long it takes to turn over (lower = faster)
const SEND_NOTE = "send it!"; // the little handwritten note next to the blue label on the back (the label is the send button)

// ---- colours ----
const PAGE_BG = "255,255,255"; // the page's background (white)
const BLUE = "100,159,255";    // the site blue
// the postcard uses the site's own colours: white paper, the site blue, and black ink
const STRIPE_DARK = "#111111"; // the dark stripes round the edge, and the dashed flight paths
const STRIPE_BLUE = "#649fff"; // the blue stripes, the label, the stamp and "say hi!" (the site blue)
const STAMP = "#649fff";       // the stamp
const PAPER = "#ffffff";       // the card
const INKY = "#111111";        // lines and writing
const FLAP_TINT_CSS = "#e3edff"; // the pale underside of the paper, showing on the turned-up corner
const HAND = '"Comic Sans MS", "Comic Sans", "Chalkboard SE", "Comic Neue", cursive'; // handwriting (the same as the logo)

const CSS = `
html, body { background-color: rgb(${PAGE_BG}) !important; }

@keyframes cp-rise { from { opacity: 0; transform: translateY(.7em); filter: blur(10px); } }
.cp-in { animation: cp-rise .9s cubic-bezier(.22,1,.36,1) backwards; animation-delay: calc(var(--i, 0) * 120ms + 150ms); }

/* the postcard: two faces in the same spot, one turned round. it flips by turning the whole card */
.pc-stage { position: relative; perspective: 1400px; }
/* when it's sent, the card fades out as the drawn paper (the same size) takes its place and folds into a plane */
.pc-fly { transition: opacity .25s ease, transform .25s ease; }
.pc-fly.is-folding { opacity: 0; transition: opacity .45s ease; }
/* the paper plane's canvas fades in over the card as it takes its place */
@keyframes pc-in { from { opacity: 0; } }
.pc-plane { animation: pc-in .45s ease backwards; }
.pc-card { position: relative; display: grid; transform-style: preserve-3d; }
.pc-card.is-back { transform: rotateY(180deg); }
/* turning over: it lifts towards you and tips back a little as it spins, then settles down flat again */
@keyframes pc-to-back { 0% { transform: rotateY(0deg); } 50% { transform: translateZ(90px) rotateX(-8deg) rotateY(90deg) scale(1.03); } 100% { transform: rotateY(180deg); } }
@keyframes pc-to-front { 0% { transform: rotateY(180deg); } 50% { transform: translateZ(90px) rotateX(-8deg) rotateY(270deg) scale(1.03); } 100% { transform: rotateY(360deg); } }
.pc-card.anim-to-back { animation: pc-to-back ${FLIP_SECONDS}s cubic-bezier(.45,.05,.2,1); }
.pc-card.anim-to-front { animation: pc-to-front ${FLIP_SECONDS}s cubic-bezier(.45,.05,.2,1); }
/* its shadow on the page shrinks and softens while it's lifted */
.pc-shadow { position: absolute; left: 5%; right: 5%; bottom: -10px; height: 46px; border-radius: 50%; background: rgba(0,0,0,.2); filter: blur(18px); pointer-events: none; }
@keyframes pc-shadow { 50% { transform: scale(.82, .7); opacity: .45; } }
.pc-shadow.is-flipping { animation: pc-shadow ${FLIP_SECONDS}s cubic-bezier(.45,.05,.2,1); }

/* the little turned-up corner that flips the card over. the corner of the card is folded back (showing the pale
   underside), and it peels up a bit more when you point at it */
.pc-corner { position: absolute; right: 0; bottom: 0; z-index: 2; width: 40px; height: 40px; cursor: pointer; border: 0; padding: 0;
  background: linear-gradient(to top left, rgb(${PAGE_BG}) 50%, transparent 50%);
  transition: width .3s cubic-bezier(.3,.7,.3,1.3), height .3s cubic-bezier(.3,.7,.3,1.3); }
.pc-corner::before { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom right, ${FLAP_TINT_CSS} 0%, #f3f7ff 50%, transparent 50%);
  filter: drop-shadow(-1px -1px 1.5px rgba(0,0,0,.18)); }
.pc-corner svg { position: absolute; left: 5px; top: 5px; width: 13px; height: 13px; color: ${STRIPE_BLUE}; transition: transform .4s ease; }
.pc-corner:hover, .pc-corner:focus-visible { width: 54px; height: 54px; outline: none; }
.pc-corner:hover svg, .pc-corner:focus-visible svg { transform: rotate(180deg); }
.pc-corner:focus-visible::before { filter: drop-shadow(0 0 2px rgb(${BLUE})); }
@media (min-width: 768px) { .pc-corner { width: 46px; height: 46px; } .pc-corner svg { width: 15px; height: 15px; left: 6px; top: 6px; } .pc-corner:hover, .pc-corner:focus-visible { width: 62px; height: 62px; } }
@media (min-width: 768px) { .pc-card { aspect-ratio: 2 / 1; } }

/* each face: the airmail stripes round the edge, cream paper inside */
.pc-face {
  grid-area: 1 / 1; position: relative; overflow: hidden; border-radius: 6px; padding: 12px;
  -webkit-backface-visibility: hidden; backface-visibility: hidden;
  background: repeating-linear-gradient(135deg, ${STRIPE_DARK} 0 16px, ${PAPER} 16px 26px, ${STRIPE_BLUE} 26px 42px, ${PAPER} 42px 52px);
}
@media (min-width: 768px) { .pc-face { padding: 16px; } }
.pc-back { transform: rotateY(180deg); }
.pc-paper { position: relative; height: 100%; background: ${PAPER}; border-radius: 2px; }

/* the back: message on the left, a line down the middle, the stamp and who it's from on the right. on phones: stamp, message, then who it's from */
.pc-grid { display: grid; height: 100%; padding: 1.25rem; gap: 1.25rem; grid-template-areas: "addr" "msg" "from" "send"; }
@media (min-width: 768px) {
  .pc-grid { padding: 1.75rem 2rem; gap: 0 2rem; grid-template-columns: 1.4fr 2px 1fr; grid-template-rows: auto 1fr auto;
    grid-template-areas: "msg line addr" "msg line from" "msg line send"; }
}
.pc-line { grid-area: line; background: ${INKY}; opacity: .55; border-radius: 2px; }
@media (max-width: 767px) { .pc-line { display: none; } }

/* the message: written on drawn lines that scroll with the text */
.pc-lines {
  display: block; width: 100%; resize: none; border: 0; outline: none; background-color: transparent;
  font: inherit; font-family: ${HAND}; font-size: 1.1rem; line-height: 2.6rem; color: ${INKY};
  background-image: repeating-linear-gradient(to bottom, transparent 0, transparent calc(2.6rem - 2px), rgba(17,17,17,.35) calc(2.6rem - 2px), rgba(17,17,17,.35) 2.6rem);
  background-attachment: local;
}
.pc-lines::placeholder, .pc-field::placeholder { color: rgba(17,17,17,.38); }
.pc-field {
  display: block; width: 100%; border: 0; border-bottom: 2px solid rgba(17,17,17,.35); outline: none; background: transparent;
  padding: .35rem 0; font: inherit; font-family: ${HAND}; font-size: 1.05rem; color: ${INKY};
  transition: border-color .25s ease;
}
.pc-field:focus { border-color: rgb(${BLUE}); }
.pc-lines:focus { background-image: repeating-linear-gradient(to bottom, transparent 0, transparent calc(2.6rem - 2px), rgba(${BLUE},.7) calc(2.6rem - 2px), rgba(${BLUE},.7) 2.6rem); }
.pc-small { font-family: ${HAND}; font-size: .85rem; color: rgba(17,17,17,.6); }

/* the stamp: flat pink with a scalloped edge (dots of the paper colour round it) and a white plane */
.pc-stamp { position: relative; width: 74px; height: 88px; flex: none; transform: rotate(4deg);
  background: radial-gradient(circle at 5px 5px, ${PAPER} 3px, ${STAMP} 3.4px) -5px -5px / 10px 10px; }
.pc-stamp-in { position: absolute; inset: 4px; background: ${STAMP}; }
.pc-stamp-frame { position: absolute; inset: 5px; border: 2px solid rgba(255,255,255,.9); border-radius: 2px; display: flex; align-items: center; justify-content: center; }

/* the blue label on the back is the send button: it lifts and its plane nudges forward when you point at it */
.pc-send { transform: rotate(-3deg); cursor: pointer; transition: transform .3s cubic-bezier(.3,.7,.3,1.4), box-shadow .3s ease; }
.pc-send:hover:not(:disabled), .pc-send:focus-visible { transform: rotate(-1deg) translateY(-3px) scale(1.05); outline: none; }
.pc-send:focus-visible { box-shadow: 0 0 0 2px ${STRIPE_BLUE}, 0 0 0 5px rgba(${BLUE}, .45) !important; }
.pc-send svg { transition: transform .3s ease; }
.pc-send:hover:not(:disabled) svg { transform: translate(3px, -3px); }
.pc-send:disabled { cursor: default; }
@keyframes pc-wiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(-3deg) translateY(-2px); } }
.pc-send.is-busy { animation: pc-wiggle .5s ease-in-out infinite; }

/* the plane on the front flies along its dashed path */
@keyframes pc-dash { to { stroke-dashoffset: -40; } }
.pc-path { animation: pc-dash 2.4s linear infinite; }

/* buttons */
.cf-pill {
  display: inline-flex; align-items: center; gap: .5rem;
  border-radius: 9999px; border: 1px solid rgba(0,0,0,.2); padding: .6rem 1.2rem;
  color: rgba(0,0,0,.85); text-decoration: none; background: transparent; font: inherit; cursor: pointer;
  transition: background .3s ease, border-color .3s ease, transform .3s ease;
}
.cf-pill:hover, .cf-pill:focus-visible { background: rgba(0,0,0,.05); border-color: rgba(${BLUE}, .8); transform: translateY(-2px); outline: none; }

/* the hidden field that catches spam bots (real people never see it) */
.cf-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

@media (prefers-reduced-motion: reduce) {
  /* the flip, the postmark and the fly-away are short and only happen when you click, so they still play.
     only the things that keep moving on their own stop */
  .cp-in, .pc-path, .pc-send.is-busy { animation: none; }
}
`;

// a simple plane, pointing right
function Plane({ size = 34, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill={color} d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="rotate(90 12 12)" />
    </svg>
  );
}

// a paper plane, for the label
function PaperPlane() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 11 21 3l-5 18-4.5-7.5L2.5 11Z" />
      <path d="M11.5 13.5 21 3" />
    </svg>
  );
}

// the stamp: pink, with a plane on it
function Stamp() {
  return (
    <div className="pc-stamp" aria-hidden="true">
      <div className="pc-stamp-in"><div className="pc-stamp-frame"><Plane /></div></div>
    </div>
  );
}

// the blue label in the corner
function Label({ small = false }: { small?: boolean }) {
  return (
    <div className={`inline-flex -rotate-3 items-center gap-2 rounded-md border-2 border-white/90 ${small ? "px-2.5 py-1" : "px-3 py-1.5 sm:px-4 sm:py-2"}`}
      style={{ background: STRIPE_BLUE, boxShadow: `0 0 0 2px ${STRIPE_BLUE}` }} aria-hidden="true">
      <PaperPlane />
      <div className="leading-none text-white">
        <p className={`font-bold tracking-wide ${small ? "text-sm" : "text-lg sm:text-2xl"}`}>{LABEL_TEXT}</p>
        <p className={`mt-0.5 uppercase tracking-[.25em] ${small ? "text-[.55rem]" : "text-[.6rem] sm:text-xs"}`}>{LABEL_SMALL}</p>
      </div>
    </div>
  );
}

// the round postmark with wavy lines trailing off to the left. date = what goes in the middle
function Postmark({ date, color, className, style }: { date: string; color: string; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 132 80" aria-hidden="true">
      <defs>
        <path id={`pc-ring-${date.length}`} d="M 92 40 m -27 0 a 27 27 0 1 1 54 0 a 27 27 0 1 1 -54 0" />
      </defs>
      {[28, 36, 44, 52].map((y) => (
        <path key={y} d={`M 2 ${y} q 8 -5 16 0 t 16 0 t 16 0 t 14 0`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      ))}
      <circle cx="92" cy="40" r="36" fill="none" stroke={color} strokeWidth="2.4" />
      <circle cx="92" cy="40" r="20" fill="none" stroke={color} strokeWidth="1.6" />
      <text fill={color} fontSize="8.4" fontWeight="700" letterSpacing="1.2" fontFamily="ui-monospace, monospace">
        <textPath href={`#pc-ring-${date.length}`}>{POSTMARK_TEXT.toUpperCase().repeat(2)}</textPath>
      </text>
      <text x="92" y="43.5" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="ui-monospace, monospace">{date}</text>
    </svg>
  );
}

const ArrowUpRight = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17L17 7M8 7h9v9" />
  </svg>
);

// idle = writing it, sending = on its way, flying = sent: it folds into a paper plane and flies off, done = the thank-you
type Phase = "idle" | "sending" | "error" | "flying" | "done";

// ---------- the paper plane fold (3d, drawn with three.js) ----------
// The postcard becomes a real sheet of paper (with your message written on it), cut into pieces along the fold lines
// of a classic dart paper plane. Each piece turns about the real fold lines, one fold after another:
//   1. the two front corners fold in to the middle   2. the new edges fold in to the middle again
//   3. it folds in half                               4. the wings fold back out
// The camera starts looking straight down at the card (so it lines up with the card on the page), then swings round
// to the plane's right side, and the plane glides off into the distance.
// The paper is 2 wide (x, nose at +x) by 1 tall (z), lying flat; +y is up off the page.
type V2 = [number, number];
type Crease = { a: V2; b: V2; dir: THREE.Vector3; m: V2 };
type Piece = { orig: V2[]; c1: Crease | null; c2: Crease | null; W1: THREE.Matrix4; W2: THREE.Matrix4; L1: number; L2: number; c3: Crease | null; c4: Crease | null; edges?: number[][] };

const PLANE_BODY = 0.13;    // how deep the plane's body (keel) is at the tail, out of the paper's half-width of 0.5 (it narrows to nothing at the nose)
const PLANE_HALF = 80;      // how far each half turns up when it's folded in half, in degrees
const PLANE_WINGS = 74;     // how far the wings fold back out, in degrees (a bit less than PLANE_HALF, so they tip up slightly)
const SIDE_VIEW = 62;       // where the camera ends up, in degrees from straight above (90 = exactly side on)
const SIDE_BEHIND = 22;     // and how far round towards the back it goes, in degrees (0 = exactly from the right side)
const PAPER_EPS = 0.006;    // how far apart the layers of folded paper sit (just enough that they don't flicker)
// which way it zooms off (as you see it): mostly to the right, a little up, and a little away from you. It flies until
// it's off the right side of the window (exit: 1 = the window's edge), and the star pings just inside the edge (star)
const FLIGHT = { right: 1, up: 0.3, away: 1, exit: 1.7, star: 0.8 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// cut a convex shape along a line, keeping one side (keep = 1 or -1)
function clipHalf(poly: V2[], a: V2, b: V2, keep: number): V2[] {
  const side = (p: V2) => ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) * keep;
  const out: V2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], sp = side(p), sq = side(q);
    if (sp >= 0) out.push(p);
    if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out;
}
const area = (poly: V2[]) => Math.abs(poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const centroid = (poly: V2[]): V2 => [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];
const onSide = (p: V2, c: { a: V2; b: V2 }) => (c.b[0] - c.a[0]) * (p[1] - c.a[1]) - (c.b[1] - c.a[1]) * (p[0] - c.a[0]);
const map2 = (p: V2, m: THREE.Matrix4): V2 => { const v = new THREE.Vector3(p[0], 0, p[1]).applyMatrix4(m); return [v.x, v.z]; };

// turning about a fold line that lies on the paper
function rotAbout(a: V2, dir: THREE.Vector3, ang: number) {
  return new THREE.Matrix4().makeTranslation(a[0], 0, a[1])
    .multiply(new THREE.Matrix4().makeRotationAxis(dir, ang))
    .multiply(new THREE.Matrix4().makeTranslation(-a[0], 0, -a[1]));
}
// a fold line, turned the way that lifts the moving side up off the page (m = a point on the moving side)
function crease(a: V2, b: V2, m: V2): Crease {
  const dir = new THREE.Vector3(b[0] - a[0], 0, b[1] - a[1]).normalize();
  const test = new THREE.Vector3(m[0], 0, m[1]).applyMatrix4(rotAbout(a, dir, 0.2));
  if (test.y < 0) dir.negate();
  return { a, b, dir, m };
}

// cuts the sheet into pieces along every fold, and works out where each piece is after each flat fold
function buildPieces(): Piece[] {
  const I = new THREE.Matrix4();
  const split = (list: Piece[], W: (p: Piece) => THREE.Matrix4, a: V2, b: V2) => list.flatMap((p) => {
    const w = W(p), inv = w.clone().invert(), cur = p.orig.map((q) => map2(q, w));
    return [1, -1].map((k) => clipHalf(cur, a, b, k)).filter((part) => part.length >= 3 && area(part) > 1e-6)
      .map((part) => ({ ...p, orig: part.map((q) => map2(q, inv)) }));
  });
  let pieces: Piece[] = [{ orig: [[-1, -0.5], [1, -0.5], [1, 0.5], [-1, 0.5]], c1: null, c2: null, W1: I, W2: I, L1: 0, L2: 0, c3: null, c4: null }];
  // 1: the front corners fold in to the middle
  const f1 = [crease([0.5, 0.5], [1, 0], [1, 0.5]), crease([0.5, -0.5], [1, 0], [1, -0.5])];
  for (const c of f1) pieces = split(pieces, () => I, c.a, c.b);
  pieces = pieces.map((p) => {
    const ctr = centroid(p.orig), c = f1.find((f) => Math.sign(onSide(ctr, f)) === Math.sign(onSide(f.m, f))) ?? null;
    return { ...p, c1: c, W1: c ? rotAbout(c.a, c.dir, Math.PI) : I, L1: c ? 1 : 0 };
  });
  // 2: the new slanted edges fold in to the middle again
  const xB = 1 - 0.5 / Math.tan(Math.PI / 8);
  const f2 = [crease([xB, 0.5], [1, 0], [0.6, 0.49]), crease([xB, -0.5], [1, 0], [0.6, -0.49])];
  for (const c of f2) pieces = split(pieces, (p) => p.W1, c.a, c.b);
  pieces = pieces.map((p) => {
    const ctr = map2(centroid(p.orig), p.W1), c = f2.find((f) => Math.sign(onSide(ctr, f)) === Math.sign(onSide(f.m, f))) ?? null;
    return { ...p, c2: c, W2: c ? rotAbout(c.a, c.dir, Math.PI).multiply(p.W1) : p.W1, L2: c ? 3 - p.L1 : p.L1 };
  });
  // 3: fold in half along the middle (each half turns up). 4: the wings fold back out, along lines that run from
  // the nose back to the body's depth at the tail, so the wings are long triangles like a real dart
  const f3 = [crease([-3, 0], [3, 0], [0, 0.3]), crease([-3, 0], [3, 0], [0, -0.3])];
  const f4 = [crease([-1, PLANE_BODY], [1, 0.012], [0, 0.45]), crease([-1, -PLANE_BODY], [1, -0.012], [0, -0.45])];
  pieces = split(pieces, (p) => p.W2, f3[0].a, f3[0].b);
  for (const c of f4) pieces = split(pieces, (p) => p.W2, c.a, c.b);
  // each piece's ink lines, sorted by when they appear: [0] = the real edge of the paper (there from the start), and
  // [1] to [4] = the edge that each fold makes (inked in as that fold happens, so the folded shape keeps its outline)
  const onLine = (q: V2, c: { a: V2; b: V2 }) => Math.abs(onSide(q, c)) / Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]) < 1e-5;
  const paperEdge = (q: V2, r: V2) => (Math.abs(q[0] - r[0]) < 1e-6 && Math.abs(Math.abs(q[0]) - 1) < 1e-6) || (Math.abs(q[1] - r[1]) < 1e-6 && Math.abs(Math.abs(q[1]) - 0.5) < 1e-6);
  const folds: [Crease[], (p: Piece) => THREE.Matrix4][] = [[f1, () => I], [f2, (p) => p.W1], [f3, (p) => p.W2], [f4, (p) => p.W2]];
  return pieces.map((p) => {
    const ctr = map2(centroid(p.orig), p.W2), i = ctr[1] > 0 ? 0 : 1;
    const wing = Math.sign(onSide(ctr, f4[i])) === Math.sign(onSide(f4[i].m, f4[i]));
    const edges: number[][] = [[], [], [], [], []];
    p.orig.forEach((q, j) => {
      const r = p.orig[(j + 1) % p.orig.length];
      let k = paperEdge(q, r) ? 0 : -1;
      folds.forEach(([cs, W], n) => { if (k < 0 && cs.some((c) => onLine(map2(q, W(p)), c) && onLine(map2(r, W(p)), c))) k = n + 1; });
      if (k >= 0) edges[k].push(q[0], 0, q[1], r[0], 0, r[1]);
    });
    return { ...p, c3: f3[i], c4: wing ? f4[i] : null, edges };
  });
}

// what they wrote, on a see-through canvas (2048 x 1024, laid out like the back of the card). It's laid over the paper
// and fades off as the folding starts, so the plane is folded from clean white paper
function drawInk(msg: { message: string; name: string; email: string }) {
  const W = 2048, H = 1024, k = W / 976;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  if (!g) return c;
  // the stamp (pink, scalloped, with a white frame)
  const stamp = (x: number, y: number) => {
    g.save(); g.translate(x * k, y * k); g.rotate(4 * Math.PI / 180);
    g.fillStyle = STAMP; g.fillRect(0, 0, 74 * k, 88 * k);
    g.fillStyle = PAPER;
    for (let i = 0; i <= 74; i += 10) { g.beginPath(); g.arc(i * k, 0, 3 * k, 0, 7); g.arc(i * k, 88 * k, 3 * k, 0, 7); g.fill(); }
    for (let i = 0; i <= 88; i += 10) { g.beginPath(); g.arc(0, i * k, 3 * k, 0, 7); g.arc(74 * k, i * k, 3 * k, 0, 7); g.fill(); }
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 2 * k; g.strokeRect(9 * k, 9 * k, 56 * k, 70 * k);
    g.restore();
  };
  // the blue label
  const label = (x: number, y: number, words: string[]) => {
    g.save(); g.translate(x * k, y * k); g.rotate(-3 * Math.PI / 180);
    g.fillStyle = STRIPE_BLUE; g.beginPath(); g.roundRect(0, 0, 158 * k, 58 * k, 6 * k); g.fill();
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 2 * k; g.beginPath(); g.roundRect(3 * k, 3 * k, 152 * k, 52 * k, 5 * k); g.stroke();
    g.fillStyle = "#fff";
    if (words[0]) { g.font = `bold ${18 * k}px ui-sans-serif, system-ui, sans-serif`; g.fillText(words[0], 48 * k, 28 * k); }
    if (words[1]) { g.font = `${9 * k}px ui-sans-serif, system-ui, sans-serif`; g.fillText(words[1], 48 * k, 44 * k); }
    g.restore();
  };
  const hand = (px: number) => `${px * k}px ${HAND}`;
  g.strokeStyle = "rgba(17,17,17,.35)"; g.lineWidth = 2 * k;
  // the message on its lines
  for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(48 * k, (85 + i * 41.5) * k); g.lineTo(523 * k, (85 + i * 41.5) * k); g.stroke(); }
  g.fillStyle = INKY; g.font = hand(17.6);
  const lines: string[] = [];
  for (const para of msg.message.split(/\n/)) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const next = line ? line + " " + word : word;
      if (g.measureText(next).width > 470 * k && line) { lines.push(line); line = word; } else line = next;
    }
    lines.push(line);
  }
  lines.slice(0, 7).forEach((l, i) => g.fillText(l, 48 * k, (75 + i * 41.5) * k));
  // the line down the middle
  g.strokeStyle = "rgba(17,17,17,.55)"; g.beginPath(); g.moveTo(555 * k, 44 * k); g.lineTo(555 * k, (488 - 44) * k); g.stroke();
  stamp(854, 44);
  // who it's from
  g.fillStyle = "rgba(17,17,17,.6)"; g.font = hand(13.6);
  g.fillText("from", 589 * k, 204 * k); g.fillText("reply to", 589 * k, 287 * k);
  g.fillStyle = INKY; g.font = hand(16.8);
  g.fillText(msg.name, 589 * k, 236 * k); g.fillText(msg.email, 589 * k, 318 * k);
  g.strokeStyle = "rgba(17,17,17,.35)";
  for (const y of [249, 330]) { g.beginPath(); g.moveTo(589 * k, y * k); g.lineTo(928 * k, y * k); g.stroke(); }
  label(590, 385, [LABEL_TEXT, "SENT!"]);
  return c;
}

// the star that pings where the plane vanishes: a four-point star in the site's blue with a navy ink outline,
// a white glint, and two little sparkle dots beside it. drawn once onto a canvas
function starTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  if (!g) return c;
  g.translate(64, 64);
  g.lineJoin = "round"; g.strokeStyle = "#262b3d"; g.lineWidth = 5;
  g.beginPath();
  for (let i = 0; i < 8; i++) { const r = i % 2 ? 12 : 52, a = (i * Math.PI) / 4; g.lineTo(Math.sin(a) * r, -Math.cos(a) * r); }
  g.closePath(); g.fillStyle = STRIPE_BLUE; g.fill(); g.stroke();
  g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(-6, -10, 4, 8, 0.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#262b3d";
  for (const [x, y, r] of [[40, -38, 4], [-42, 34, 3]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  return c;
}

// The canvas covers the whole window (so the plane can fly anywhere), and the camera is lined up so the paper sits
// exactly where the card was. card = the card's box on the screen.
// It's drawn like a cartoon: flat cel shading with bold navy ink outlines, white paper with a pale blue underside.
// What they wrote fades off, the paper shrinks as it folds itself up quickly while floating and swaying (so it never
// moves like a machine), the camera drifts round to its side, the finished plane flutters its wings excitedly for a
// moment, then zooms off instantly with a barrel roll, trailing wind streaks, and vanishes with a star that pings
// in the distance (like a cartoon villain blasting off).
const FLY = {
  inkOff: [0.05, 0.4],                                                        // what they wrote fades off the paper
  f1: [0.08, 0.42], f2: [0.44, 0.76], f3: [0.78, 1.1], f4: [1.1, 1.4],       // the four folds (start, end), in seconds
  shrink: [0.05, 1.2], size: 0.55,                                            // it shrinks as it folds, to this much of the card's size
  turn: [0.05, 1.4],                                                          // the camera drifting round to the plane's side
  flutter: [1.3, 1.9],                                                        // its wings flutter excitedly
  zip: [1.9, 2.4],                                                            // then it zooms off
  star: 0.5,                                                                  // how long the star at the edge lasts
  fade: 0.15,                                                                 // then it all fades out
  ink: 0x262b3d, inkWidth: 3, foldWidth: 2.2, inkIn: 0.3,                     // the ink (colour, outline px, fold-line px, fade-in s)
  shadow: 0xc4d3ff, underside: 0xdbe7ff, wind: 0x8db4ff, windWidth: 2,                           // the shadow's tint, and the wind streaks
};

// the softest ease there is: starts gently, glides, and settles gently (no overshoot, no snap)
const easeSine = (x: number) => (1 - Math.cos(Math.PI * clamp01(x))) / 2;
const foldCurve = (t: number, [a, b]: number[]) => easeSine((t - a) / (b - a));
// a fold: quick off the mark and settling softly, like a flick of paper (no overshoot)
const snapCurve = (t: number, [a, b]: number[]) => 1 - Math.pow(1 - clamp01((t - a) / (b - a)), 3);

function FoldAway({ msg, card, onDone }: { msg: { message: string; name: string; email: string }; card: DOMRect; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    // cel shading: a pale blue light everywhere (that's the colour of the shadows), plus a sun that turns the sides
    // facing it pure white, with a crisp edge between the two, like an anime
    scene.add(new THREE.AmbientLight(FLY.shadow, 2.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(0.6, 3, -1.4); // from the far side, so the side of the plane facing you (its keel) sits in shadow
    scene.add(sun);

    // the camera: straight above the card's middle, as far away as makes the paper (2 wide) exactly as wide as the card.
    // it looks at the card's middle, so the picture is drawn off-centre (setViewOffset) to put that point where the card is
    const cx = card.left + card.width / 2, cy = card.top + card.height / 2;
    const VW = 2 * Math.max(cx, w - cx), VH = 2 * Math.max(cy, h - cy); // a bigger view centred on the card...
    const fov = 30, tan = Math.tan((fov / 2) * Math.PI / 180);
    const d0 = (VH / (card.width / 2)) / (2 * tan);
    const camera = new THREE.PerspectiveCamera(fov, VW / VH, 0.3, 60); // a tight near / far, so the layers of paper sort cleanly
    camera.setViewOffset(VW, VH, VW / 2 - cx, VH / 2 - cy, w, h); // ...of which the window shows its part

    const inkTex = new THREE.CanvasTexture(drawInk(msg)), starTex = new THREE.CanvasTexture(starTexture());
    inkTex.colorSpace = starTex.colorSpace = THREE.SRGBColorSpace;
    inkTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    // two flat tones with a crisp edge: anything not facing the sun fairly squarely is in the pale blue shadow
    // (so the flat wings are white and the steep sides, like the keel, are shaded, as in an anime)
    const tones = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 4, 1, THREE.RedFormat);
    tones.minFilter = tones.magFilter = THREE.NearestFilter;
    tones.needsUpdate = true;
    // the paper (the same on both sides). it sits a hair behind its ink lines and writing, so those always draw on top
    const faceOpts = { gradientMap: tones, polygonOffset: true, polygonOffsetFactor: 0.5, polygonOffsetUnits: 0.5 };
    const paper = new THREE.MeshToonMaterial({ color: PAPER, side: THREE.FrontSide, ...faceOpts });
    const under = new THREE.MeshToonMaterial({ color: FLY.underside, side: THREE.BackSide, ...faceOpts }); // the pale blue underside
    const ink = new THREE.MeshBasicMaterial({ map: inkTex, transparent: true, depthWrite: false, side: THREE.FrontSide });
    // the ink: one material for the paper's own edge, and one for the edges each fold makes (so each can fade in on its own)
    const edges = [0, 1, 2, 3, 4].map((k) => new LineMaterial({ color: FLY.ink, linewidth: k ? FLY.foldWidth : FLY.inkWidth, transparent: true, opacity: 0 }));
    const windM = new LineMaterial({ color: FLY.wind, linewidth: FLY.windWidth, transparent: true, opacity: 0.85 });
    for (const m of [...edges, windM]) m.resolution.set(w, h);

    const plane = new THREE.Group();
    scene.add(plane);
    const disposables: { dispose: () => void }[] = [inkTex, starTex, tones, paper, under, ink, windM, ...edges];
    const inkMeshes: THREE.Mesh[] = [];
    const pieces = buildPieces().map((p) => {
      const pos: number[] = [], uv: number[] = [];
      for (let i = 1; i < p.orig.length - 1; i++) {
        let tri = [p.orig[0], p.orig[i], p.orig[i + 1]];
        // face up (+y) on the written side
        const cr = (tri[1][1] - tri[0][1]) * (tri[2][0] - tri[0][0]) - (tri[1][0] - tri[0][0]) * (tri[2][1] - tri[0][1]);
        if (cr < 0) tri = [tri[0], tri[2], tri[1]];
        for (const [x, z] of tri) { pos.push(x, 0, z); uv.push((x + 1) / 2, 0.5 - z); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.computeVertexNormals();
      disposables.push(geo);
      const inkMesh = new THREE.Mesh(geo, ink);
      inkMeshes.push(inkMesh);
      const objs: THREE.Object3D[] = [new THREE.Mesh(geo, paper), new THREE.Mesh(geo, under), inkMesh];
      // its ink lines (see buildPieces): the paper's edge, and the edges its folds make
      (p.edges ?? []).forEach((line, k) => {
        if (!line.length) return;
        const lineGeo = new LineSegmentsGeometry().setPositions(line);
        disposables.push(lineGeo);
        objs.push(new LineSegments2(lineGeo, edges[k]));
      });
      objs.forEach((m) => { m.matrixAutoUpdate = false; plane.add(m); });
      return { p, objs };
    });

    // the paper's two back corners, which become the wingtips (for the wind streaks)
    const tips = [0.5, -0.5].map((z) => ({ piece: pieces.find(({ p }) => p.orig.some((q) => Math.abs(q[0] + 1) < 1e-6 && Math.abs(q[1] - z) < 1e-6)), local: new THREE.Vector3(-1, 0, z) }));
    // a wind streak behind each wingtip: the tip's last few places, joined up (drawn only while it glides)
    const TRAIL = 14, TRAIL_SECONDS = 0.15; // how many points each streak has, and how far back in time it reaches
    const trails = tips.map(() => {
      const geo = new LineGeometry();
      geo.setPositions(new Array(TRAIL * 3).fill(0));
      const line = new Line2(geo, windM);
      line.frustumCulled = false;
      line.visible = false;
      scene.add(line);
      disposables.push(geo);
      return { geo, line, pts: [] as { p: THREE.Vector3; t: number }[] };
    });

    // the star where it vanishes
    const starM = new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, depthTest: false });
    const star = new THREE.Sprite(starM);
    star.scale.setScalar(0);
    scene.add(star);
    disposables.push(starM);

    // get everything onto the graphics card before the clock starts, so the first frames don't stutter
    renderer.initTexture(inkTex);
    renderer.initTexture(starTex);
    renderer.compile(scene, camera);

    const lift = (y: number) => new THREE.Matrix4().makeTranslation(0, y, 0);
    const nose = new THREE.Vector3(1, 0, 0), upAxis = new THREE.Vector3(0, 1, 0), wingAxis = new THREE.Vector3(0, 0, 1);
    const qLook = new THREE.Quaternion(), qPitch = new THREE.Quaternion(), qRoll = new THREE.Quaternion();
    const deg = Math.PI / 180;
    let raf = 0, start = -1, away: THREE.Vector3 | null = null, heading: THREE.Quaternion | null = null;
    let starAt = Infinity; const starPos = new THREE.Vector3(); // when and where the star pings (worked out once it knows its path)
    const frame = (now: number) => {
      if (start < 0) start = now;
      const t = (now - start) / 1000;
      const s1 = snapCurve(t, FLY.f1), s2 = snapCurve(t, FLY.f2), s3 = snapCurve(t, FLY.f3), s4 = snapCurve(t, FLY.f4);
      // the writing fades off, and the paper's edges fade in, both softly
      ink.opacity = 1 - foldCurve(t, FLY.inkOff);
      for (const m of inkMeshes) m.visible = ink.opacity > 0.002;
      edges[0].opacity = easeSine(t / FLY.inkIn);
      [FLY.f1, FLY.f2, FLY.f3, FLY.f4].forEach((f, k) => { edges[k + 1].opacity = easeSine((t - f[0]) / ((f[1] - f[0]) * 0.6)); });
      // the flutter and the zoom, worked out first because the wings use them
      const fl = clamp01((t - FLY.flutter[0]) / (FLY.flutter[1] - FLY.flutter[0]));
      const z = clamp01((t - FLY.zip[0]) / (FLY.zip[1] - FLY.zip[0]));
      // quick excited flaps, strongest in the middle of the flutter, and still going a little as it zooms off
      const flap = 18 * Math.sin(t * 2 * Math.PI * 7) * (Math.sin(Math.PI * fl) + 0.4 * (1 - z) * (z > 0 ? 1 : 0));
      for (const { p, objs } of pieces) {
        let M: THREE.Matrix4;
        if (t < FLY.f2[0]) M = p.c1 ? lift(PAPER_EPS * s1).multiply(rotAbout(p.c1.a, p.c1.dir, Math.PI * s1)) : new THREE.Matrix4();
        else if (t < FLY.f3[0]) M = p.c2 ? lift(PAPER_EPS * (p.L1 + (p.L2 - p.L1) * s2)).multiply(rotAbout(p.c2.a, p.c2.dir, Math.PI * s2)).multiply(p.W1) : lift(PAPER_EPS * p.L1).multiply(p.W1);
        else M = lift(PAPER_EPS * p.L2).multiply(p.W2);
        if (p.c4 && t > FLY.f4[0]) M = rotAbout(p.c4.a, p.c4.dir, -(PLANE_WINGS * s4 + flap) * deg).multiply(M); // the wings fold back out (and flap)
        if (p.c3 && t > FLY.f3[0]) M = rotAbout(p.c3.a, p.c3.dir, PLANE_HALF * deg * s3).multiply(M);           // each half folds up
        objs.forEach((m) => m.matrix.copy(M));
      }
      // the camera drifts round to the plane's side, pulling back a little so the plane sits small on the page
      const turn = foldCurve(t, FLY.turn);
      const phi = SIDE_VIEW * deg * turn, az = -SIDE_BEHIND * deg * turn;
      const r = d0 * (1 + 0.15 * turn), ty = 0.05 * s3;
      camera.position.set(r * Math.sin(phi) * Math.sin(az), ty + r * Math.cos(phi), r * Math.sin(phi) * Math.cos(az));
      camera.up.set(-Math.cos(phi) * Math.sin(az), Math.sin(phi), -Math.cos(phi) * Math.cos(az));
      camera.lookAt(0, ty, 0);

      // which way it'll fly, worked out from where the camera ended up: off the right side of the window. It steps
      // along that line to find how far it has to go to be off screen, and where it passes the edge (for the star)
      if (t > FLY.turn[1] && !away) {
        const fwd = new THREE.Vector3(0, ty, 0).sub(camera.position).normalize();
        const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
        const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
        const dir = right.multiplyScalar(FLIGHT.right).add(up.multiplyScalar(FLIGHT.up)).add(fwd.multiplyScalar(FLIGHT.away)).normalize();
        camera.updateMatrixWorld();
        const onScreen = (d: number) => dir.clone().multiplyScalar(d).add(new THREE.Vector3(0, 0.12, 0)).project(camera).x;
        let dStar = 0, dExit = 0;
        for (let d = 0; d < 80 && !dExit; d += 0.05) {
          if (!dStar && onScreen(d) > FLIGHT.star) dStar = d;
          if (onScreen(d) > FLIGHT.exit) dExit = d;
        }
        dExit = dExit || 20; dStar = dStar || dExit * 0.8;
        away = dir.clone().multiplyScalar(dExit);
        starPos.copy(dir).multiplyScalar(dStar).add(new THREE.Vector3(0, 0.12, 0));
        // the moment it passes the star's spot (the zoom below covers 1 - (1 - z)^2.2 of the way)
        starAt = FLY.zip[0] + (FLY.zip[1] - FLY.zip[0]) * (1 - Math.pow(1 - dStar / dExit, 1 / 2.2));
        heading = new THREE.Quaternion().setFromUnitVectors(nose, dir);
      }
      // it shrinks as it folds, and floats up a touch, swaying and tipping as it goes (so it's never stiff)
      const size = 1 - (1 - FLY.size) * foldCurve(t, FLY.shrink);
      const folding = Math.sin(Math.PI * clamp01(t / FLY.f4[1]));
      const float = 0.12 * foldCurve(t, [0.1, 1.4]) + Math.sin(t * 9) * 0.02 * fl;
      qLook.setFromAxisAngle(upAxis, 0.12 * Math.sin(t * 5.5) * folding);
      qRoll.setFromAxisAngle(nose, 0.1 * Math.sin(t * 7) * folding + 0.08 * Math.sin(t * 23) * fl + Math.PI * 2 * easeSine(z * 1.3));
      // a tiny squash while it flutters, then it stretches out long the instant it zooms off
      const stretch = z > 0 ? 0.45 * Math.pow(1 - z, 0.5) : 0;
      const squash = 0.05 * Math.sin(t * 2 * Math.PI * 7) * Math.sin(Math.PI * fl);
      plane.scale.set(size * (1 + stretch - squash), size * (1 - 0.25 * stretch + squash), size * (1 - 0.25 * stretch + squash));
      // its nose lifts eagerly while it flutters
      qPitch.setFromAxisAngle(wingAxis, 0.18 * Math.sin(Math.PI * fl));
      if (away && heading) {
        // the zoom: fast from the very first moment, easing off only as it gets far away
        plane.position.copy(away).multiplyScalar(1 - Math.pow(1 - z, 2.2)).add(new THREE.Vector3(0, float, 0));
        // it turns to face the way it's going while it flutters
        plane.quaternion.identity().slerp(heading, easeSine((t - FLY.turn[1]) / (FLY.flutter[1] - FLY.turn[1]))).multiply(qLook).multiply(qPitch).multiply(qRoll);
      } else {
        plane.position.set(0, float, 0);
        plane.quaternion.copy(qLook).multiply(qPitch).multiply(qRoll);
      }
      const g = z; // (the wind streaks show while it's zooming off)
      plane.visible = z < 0.96;
      // the star pings at the edge as it passes: it pops up, spins, and shrinks away
      const st = clamp01((t - starAt) / FLY.star);
      if (away && st > 0 && st < 1) {
        star.position.copy(starPos);
        // (sized by how far it is from the camera, so it's always about the same size on screen)
        star.scale.setScalar(0.045 * camera.position.distanceTo(starPos) * Math.pow(Math.sin(Math.PI * st), 0.7) * (st < 0.25 ? 1 + 0.25 * Math.sin(Math.PI * st * 4) : 1));
        starM.rotation = st * Math.PI;
      } else star.scale.setScalar(0);
      // the wind streaks: follow each wingtip while it glides
      plane.updateMatrixWorld();
      trails.forEach((tr, i) => {
        const tip = tips[i];
        tr.line.visible = g > 0 && plane.visible && !!tip.piece;
        if (!tr.line.visible || !tip.piece) { tr.pts.length = 0; return; }
        const now3 = tip.local.clone().applyMatrix4(tip.piece.objs[0].matrix).applyMatrix4(plane.matrixWorld);
        tr.pts.unshift({ p: now3, t });
        while (tr.pts.length > 2 && t - tr.pts[tr.pts.length - 1].t > TRAIL_SECONDS) tr.pts.pop();
        // spread the points evenly back in time along where the tip has been
        const at = (u: number) => {
          const want = t - u * Math.min(TRAIL_SECONDS, t - tr.pts[tr.pts.length - 1].t);
          for (let j = 0; j < tr.pts.length - 1; j++) {
            const a = tr.pts[j], b = tr.pts[j + 1];
            if (want <= a.t && want >= b.t) return a.p.clone().lerp(b.p, (a.t - want) / Math.max(1e-6, a.t - b.t));
          }
          return tr.pts[tr.pts.length - 1].p;
        };
        const buf = tr.geo.getAttribute("instanceStart") as THREE.InterleavedBufferAttribute, arr = buf.data.array as Float32Array;
        let prev = at(0);
        for (let j = 0; j < TRAIL - 1; j++) {
          const next = at((j + 1) / (TRAIL - 1));
          arr.set([prev.x, prev.y, prev.z, next.x, next.y, next.z], j * 6);
          prev = next;
        }
        buf.data.needsUpdate = true;
      });
      // then it all fades out softly
      const fadeAt = Number.isFinite(starAt) ? Math.max(FLY.zip[1], starAt + FLY.star - 0.05) : Infinity;
      canvas.style.opacity = t > fadeAt ? String(1 - foldCurve(t, [fadeAt, fadeAt + FLY.fade])) : "1";
      renderer.render(scene, camera);
      if (t > fadeAt + FLY.fade) { done.current(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      disposables.forEach((x) => x.dispose());
      renderer.dispose();
    };
  }, [msg, card]);

  // drawn straight into the page's body, so nothing on the page can clip it
  return createPortal(<canvas ref={ref} className="pc-plane pointer-events-none fixed inset-0 z-[60] h-full w-full" aria-hidden="true" />, document.body);
}

export default function ContactPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const [cardBox, setCardBox] = useState<DOMRect | null>(null);
  const [sent, setSent] = useState<{ message: string; name: string; email: string } | null>(null); // what they wrote, for the paper plane
  const [side, setSide] = useState<"front" | "back">("back"); // it opens on the back, ready to write on
  const [anim, setAnim] = useState(""); // which way it's turning over right now, for the animation
  const flip = () => { const to = side === "back" ? "front" : "back"; setSide(to); setAnim(`anim-to-${to}`); };


  // sends the form to /api/contact (app/api/contact/route.ts), which emails it to you with Resend
  const onSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase === "sending") return;
    const form = e.currentTarget; // grab it now: it's gone after the await below
    const data = Object.fromEntries(new FormData(form));

    setPhase("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "something went wrong, please try again");
      setSent({ message: String(data.message ?? ""), name: String(data.name ?? ""), email: String(data.email ?? "") });
      if (stageRef.current) setCardBox(stageRef.current.getBoundingClientRect());
      form.reset();
      setPhase("flying");
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong, please try again");
      setPhase("error");
    }
  };

  const back = side === "back";
  const locked = phase === "sending" || phase === "flying";

  return (
    <main className="relative min-h-[calc(100dvh-4rem)] overflow-hidden text-neutral-900" style={{ background: `rgb(${PAGE_BG})` }}>
      <style>{CSS}</style>

      <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-8 sm:pt-10 md:pb-32">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-neutral-700 transition hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          home
        </Link>

        {/* the title, the blurb, and the other ways to reach me */}
        <div className="mt-10 flex flex-wrap items-end justify-between gap-x-12 gap-y-6 md:mt-12">
          <div>
            <h1 className="cp-in text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">{CONTACT_TITLE}</h1>
            <p className="cp-in mt-5 max-w-md text-lg leading-relaxed text-neutral-700" style={{ "--i": 1 } as CSSProperties}>
              {CONTACT_BLURB}
            </p>
          </div>
          <div className="cp-in flex flex-col gap-3 text-neutral-700 md:items-end" style={{ "--i": 2 } as CSSProperties}>
            <a href={`mailto:${EMAIL}`} className="text-lg text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-900">
              {EMAIL}
            </a>
            {PHONE && (
              <a href={`tel:${PHONE.replace(/[^+\d]/g, "")}`} className="text-lg text-neutral-900 transition hover:text-neutral-700">
                {PHONE}
              </a>
            )}
            <div className="flex flex-wrap gap-2">
              {SOCIALS.filter((s) => s.href).map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="cf-pill text-sm">
                  {s.label}<ArrowUpRight />
                </a>
              ))}
            </div>
          </div>
        </div>

        {phase === "done" ? (
          // the thank-you, where the postcard was
          <div role="status" className="cp-in mx-auto mt-16 max-w-md text-center">
            <p className="text-3xl font-bold tracking-tight">postcard sent!</p>
            <p className="mt-3 text-lg text-neutral-700">thanks for writing. i&rsquo;ll get back to you soon.</p>
            <button type="button" className="cf-pill mt-8" onClick={() => { setPhase("idle"); setSide("back"); setAnim(""); }}>
              write another
            </button>
          </div>
        ) : (
          <form onSubmit={onSend} className="cp-in mt-12 md:mt-14" style={{ "--i": 3 } as CSSProperties}>
            <div ref={stageRef} className="pc-stage">
              {phase === "flying" && sent && cardBox && <FoldAway msg={sent} card={cardBox} onDone={() => setPhase("done")} />}
              <div className={`pc-fly ${phase === "flying" ? "is-folding" : ""}`}>
                <div className={`pc-shadow ${anim ? "is-flipping" : ""}`} key={`shadow-${anim}-${side}`} aria-hidden="true" />
                <div className={`pc-card ${back ? "is-back" : ""} ${anim}`} onAnimationEnd={() => setAnim("")}>
                  {/* the front: the label, the stamp with a postmark, and a plane flying a dashed loop round "say hi!" */}
                  <div className="pc-face" inert={back} aria-hidden={back}>
                    <div className="pc-paper flex min-h-[26rem] flex-col p-5 sm:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <Label />
                        <div className="relative">
                          <Stamp />
                          <Postmark date="hello" color={INKY} className="absolute -left-24 top-8 w-32 -rotate-6 sm:-left-28 sm:w-36" />
                        </div>
                      </div>
                      <div className="relative flex flex-1 items-center justify-center">
                        <svg viewBox="0 0 600 260" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                          <path className="pc-path" d="M 30 230 C 160 262, 360 258, 470 200 S 575 100, 520 72 S 455 92, 490 128 S 560 110, 560 52"
                            fill="none" stroke={STRIPE_DARK} strokeWidth="3" strokeDasharray="12 8" strokeLinecap="round" />
                          <g transform="translate(560 40) rotate(-90) translate(-17 -17)"><Plane color={STRIPE_BLUE} /></g>
                        </svg>
                        <p className="relative -rotate-3 text-6xl sm:text-8xl" style={{ fontFamily: HAND, color: STRIPE_BLUE }}>
                          {POSTCARD_CAPTION}
                        </p>
                      </div>
                    </div>
                    <button type="button" className="pc-corner" onClick={flip} aria-label="flip it over to write" title="flip it over to write">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5" />
                      </svg>
                    </button>
                  </div>

                  {/* the back: write your message here */}
                  <div className="pc-face pc-back" inert={!back || locked} aria-hidden={!back}>
                    <div className="pc-paper">
                      <div className="pc-grid">
                        <div style={{ gridArea: "msg" }} className="flex min-h-0 flex-col">
                          <label htmlFor="cf-message" className="sr-only">your message</label>
                          <textarea
                            id="cf-message" name="message" required maxLength={5000} rows={6}
                            placeholder="write your message here..."
                            className="pc-lines h-[13rem] md:h-[18.2rem]"
                          />
                          {/* a little doodle under the message: a plane on a dashed loop */}
                          <svg viewBox="0 0 300 60" className="mt-auto hidden h-14 w-full md:block" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
                            <path className="pc-path" d="M 4 44 C 60 60, 110 52, 150 34 S 200 4, 182 14 S 196 44, 240 30 S 270 20, 280 16"
                              fill="none" stroke={STRIPE_DARK} strokeWidth="2.5" strokeDasharray="10 7" strokeLinecap="round" />
                            <g transform="translate(286 14) rotate(70) translate(-12 -12)"><Plane size={24} color={STRIPE_BLUE} /></g>
                          </svg>
                        </div>
                        {/* the send button: the blue wingwang airmail label, with a little note pointing at it */}
                        <div style={{ gridArea: "send" }} className="flex items-center gap-3">
                          <button
                            type="submit"
                            disabled={locked}
                            className={`pc-send inline-flex items-center gap-2 rounded-md border-2 border-white/90 px-3 py-1.5 text-left ${phase === "sending" ? "is-busy" : ""}`}
                            style={{ background: STRIPE_BLUE, boxShadow: `0 0 0 2px ${STRIPE_BLUE}` }}
                          >
                            <PaperPlane />
                            <span className="block leading-none text-white">
                              <span className="block text-base font-bold tracking-wide sm:text-lg">{LABEL_TEXT}</span>
                              <span className="mt-0.5 block text-[.6rem] uppercase tracking-[.25em]">
                                {phase === "sending" ? "sending..." : phase === "flying" ? "sent!" : LABEL_SMALL}
                              </span>
                            </span>
                            <span className="sr-only">: send the postcard</span>
                          </button>
                          {phase !== "sending" && phase !== "flying" && (
                            <span className="flex items-center gap-1 text-lg" style={{ fontFamily: HAND, color: STRIPE_BLUE }} aria-hidden="true">
                              <svg viewBox="0 0 40 20" className="h-4 w-8" fill="none" stroke={STRIPE_DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M38 14 C 28 4, 14 4, 4 10 M4 10 l7 -5 M4 10 l8 3" />
                              </svg>
                              {SEND_NOTE}
                            </span>
                          )}
                        </div>
                        <div className="pc-line" />
                        {/* the stamp */}
                        <div style={{ gridArea: "addr" }} className="flex justify-end">
                          <div className="relative">
                            <Stamp />
                          </div>
                        </div>
                        {/* who it's from */}
                        <div style={{ gridArea: "from" }} className="flex flex-col justify-center gap-5">
                          <div>
                            <label htmlFor="cf-name" className="pc-small">from</label>
                            <input id="cf-name" name="name" type="text" required maxLength={100} autoComplete="name" placeholder="your name" className="pc-field" />
                          </div>
                          <div>
                            <label htmlFor="cf-email" className="pc-small">reply to</label>
                            <input id="cf-email" name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@example.com" className="pc-field" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button type="button" className="pc-corner" onClick={flip} aria-label="see the front" title="see the front">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5" />
                      </svg>
                    </button>
                    {/* spam trap: hidden from people, bots tend to fill it in */}
                    <div className="cf-hp" aria-hidden="true">
                      <label htmlFor="cf-website">website</label>
                      <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p role="alert" aria-live="polite" className="mt-4 min-h-5 text-sm text-red-500">
              {phase === "error" ? error : ""}
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
