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
.pc-fly.is-folding { opacity: 0; transition-delay: .1s; }
/* the paper plane's canvas fades in over the card as it takes its place */
@keyframes pc-in { from { opacity: 0; } }
.pc-plane { animation: pc-in .3s ease both; }
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
type Piece = { orig: V2[]; c1: Crease | null; c2: Crease | null; W1: THREE.Matrix4; W2: THREE.Matrix4; L1: number; L2: number; c3: Crease | null; c4: Crease | null };

const PLANE_BODY = 0.13;    // how deep the plane's body (keel) is at the tail, out of the paper's half-width of 0.5 (it narrows to nothing at the nose)
const PLANE_HALF = 80;      // how far each half turns up when it's folded in half, in degrees
const PLANE_WINGS = 74;     // how far the wings fold back out, in degrees (a bit less than PLANE_HALF, so they tip up slightly)
const SIDE_VIEW = 62;       // where the camera ends up, in degrees from straight above (90 = exactly side on)
const SIDE_BEHIND = 22;     // and how far round towards the back it goes, in degrees (0 = exactly from the right side)
const PAPER_EPS = 0.006;    // how far apart the layers of folded paper sit (just enough that they don't flicker)
// how far it zips off, in paper-widths (the paper is 2 long): away from you, to the right, and up (as you see it)
const FLIGHT = { away: 16, right: 3.5, up: 1.8 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => { const x = clamp01(v); return x * x * x * (x * (x * 6 - 15) + 10); }; // gentle in and out

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
  return pieces.map((p) => {
    const ctr = map2(centroid(p.orig), p.W2), i = ctr[1] > 0 ? 0 : 1;
    const wing = Math.sign(onSide(ctr, f4[i])) === Math.sign(onSide(f4[i].m, f4[i]));
    return { ...p, c3: f3[i], c4: wing ? f4[i] : null };
  });
}

// the paper's printed side: the back of the postcard, with what they wrote on it. 2048 x 1024, laid out like the card
function drawCard(msg: { message: string; name: string; email: string }, underside: boolean) {
  const W = 2048, H = 1024, k = W / 976;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  if (!g) return c;
  // plain white paper. the striped border is left off the paper that folds up (it poked out round the folded flaps),
  // so it fades away as the paper takes the card's place
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  // the other side of the paper (what shows wherever a fold turns it over): left completely blank
  if (underside) return c;
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

// the canvas covers the whole window (so the plane can fly anywhere), and the camera is lined up so the paper sits
// exactly where the card was. card = the card's box on the screen.
// It's animated like a cartoon: flat cel shading with ink outlines round the paper's edge, quick smooth folds,
// a soft springy wobble once it's a plane, then the plane pulls back, stretches out and zips off with a puff of smoke,
// and twinkles out of sight in the distance.
const TOON = {
  f1: [0.08, 0.5], f2: [0.55, 0.97], f3: [1.02, 1.42], f4: [1.42, 1.8],  // the four folds (start, end), in seconds
  turn: [1.0, 1.7],                                                        // the camera swinging round to the side
  windup: [2.0, 2.3], zip: [2.3, 2.85],                                    // pulling back, then zipping off
  twinkle: [2.8, 3.2],                                                     // the star where it vanished
  ink: 0x111111, inkWidth: 2.4,                                            // the outlines (colour, thickness in px)
};

const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const easeOutBack = (x: number) => { const c = 1.2, v = clamp01(x) - 1; return 1 + (c + 1) * v * v * v + c * v * v; };
// a fold: eases in and out quickly and smoothly. back = the wings overshoot a touch and settle (they never pass
// through other paper, so that's safe for them; the flat folds don't overshoot)
const easeInOut = (x: number) => { const v = clamp01(x); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
const foldCurve = (t: number, [a, b]: number[], back = false) => {
  const x = (t - a) / (b - a);
  if (x <= 0) return 0;
  return back ? easeOutBack(x) : easeInOut(x);
};
// the soft springy wobble after something lands at time `at`
const boing = (t: number, at: number, size: number) => (t < at ? 0 : size * Math.exp(-(t - at) * 7) * Math.sin((t - at) * 18));

// little round drawings for the puff of smoke and the twinkle, drawn once onto canvases
function puffTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#ffffff"; g.strokeStyle = INKY; g.lineWidth = 7;
    g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = "#e9eefc"; g.beginPath(); g.arc(76, 76, 26, 0, Math.PI * 2); g.fill();
  }
  return c;
}
function starTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  if (g) {
    g.translate(64, 64);
    g.beginPath();
    for (let i = 0; i < 8; i++) { const r = i % 2 ? 13 : 58, a = (i * Math.PI) / 4; g.lineTo(Math.sin(a) * r, -Math.cos(a) * r); }
    g.closePath();
    g.fillStyle = STRIPE_BLUE; g.strokeStyle = INKY; g.lineWidth = 6; g.lineJoin = "round";
    g.fill(); g.stroke();
  }
  return c;
}

function FoldAway({ msg, card, onDone }: { msg: { message: string; name: string; email: string }; card: DOMRect; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(0.5, 2.6, 1.4);
    scene.add(sun);

    // the camera: straight above the card's middle, as far away as makes the paper (2 wide) exactly as wide as the card.
    // it looks at the card's middle, so the picture is drawn off-centre (setViewOffset) to put that point where the card is
    const cx = card.left + card.width / 2, cy = card.top + card.height / 2;
    const VW = 2 * Math.max(cx, w - cx), VH = 2 * Math.max(cy, h - cy); // a bigger view centred on the card...
    const fov = 30, tan = Math.tan((fov / 2) * Math.PI / 180);
    const d0 = (VH / (card.width / 2)) / (2 * tan);
    const camera = new THREE.PerspectiveCamera(fov, VW / VH, 0.05, 200);
    camera.setViewOffset(VW, VH, VW / 2 - cx, VH / 2 - cy, w, h); // ...of which the window shows its part

    // cel shading: three flat tones instead of smooth light, like a cartoon
    const tones = new THREE.DataTexture(new Uint8Array([150, 205, 255]), 3, 1, THREE.RedFormat);
    tones.minFilter = tones.magFilter = THREE.NearestFilter;
    tones.needsUpdate = true;
    const textures = [drawCard(msg, false), drawCard(msg, true)].map((cv) => {
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    });
    // the faces sit a hair behind their outlines, so the ink lines always draw on top
    const faceOpts = { gradientMap: tones, polygonOffset: true, polygonOffsetFactor: 0.5, polygonOffsetUnits: 0.5 };
    const front = new THREE.MeshToonMaterial({ map: textures[0], side: THREE.FrontSide, ...faceOpts });
    const backM = new THREE.MeshToonMaterial({ map: textures[1], side: THREE.BackSide, ...faceOpts });
    const ink = new LineMaterial({ color: TOON.ink, linewidth: TOON.inkWidth, transparent: true });
    ink.resolution.set(w, h);

    const plane = new THREE.Group();
    scene.add(plane);
    const disposables: { dispose: () => void }[] = [];
    const pieces = buildPieces().map((p) => {
      const pos: number[] = [], uv: number[] = [];
      for (let i = 1; i < p.orig.length - 1; i++) {
        let tri = [p.orig[0], p.orig[i], p.orig[i + 1]];
        // face up (+y) on the printed side
        const cr = (tri[1][1] - tri[0][1]) * (tri[2][0] - tri[0][0]) - (tri[1][0] - tri[0][0]) * (tri[2][1] - tri[0][1]);
        if (cr < 0) tri = [tri[0], tri[2], tri[1]];
        for (const [x, z] of tri) { pos.push(x, 0, z); uv.push((x + 1) / 2, 0.5 - z); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.computeVertexNormals();
      // its ink outline: only the parts of its edge that are the real edge of the paper (not where it was cut up for folding)
      const onEdge = (q: V2, r: V2) => (Math.abs(q[0] - r[0]) < 1e-6 && Math.abs(Math.abs(q[0]) - 1) < 1e-6) || (Math.abs(q[1] - r[1]) < 1e-6 && Math.abs(Math.abs(q[1]) - 0.5) < 1e-6);
      const line: number[] = [];
      p.orig.forEach((q, i) => { const r = p.orig[(i + 1) % p.orig.length]; if (onEdge(q, r)) line.push(q[0], 0, q[1], r[0], 0, r[1]); });
      disposables.push(geo);
      const objs: THREE.Object3D[] = [new THREE.Mesh(geo, front), new THREE.Mesh(geo, backM)];
      if (line.length) {
        const outlineGeo = new LineSegmentsGeometry().setPositions(line);
        disposables.push(outlineGeo);
        objs.push(new LineSegments2(outlineGeo, ink));
      }
      objs.forEach((m) => { m.matrixAutoUpdate = false; plane.add(m); });
      return { p, objs };
    });


    disposables.push(ink, tones);

    // the puff of smoke where it takes off, and the twinkle where it disappears
    const puffMap = new THREE.CanvasTexture(puffTexture()), starMap = new THREE.CanvasTexture(starTexture());
    puffMap.colorSpace = starMap.colorSpace = THREE.SRGBColorSpace;
    const puffs = Array.from({ length: 6 }, (_, i) => {
      const m = new THREE.SpriteMaterial({ map: puffMap, transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Sprite(m);
      const a = (i / 6) * Math.PI * 2 + 0.4;
      scene.add(s);
      disposables.push(m);
      return { s, m, dir: new THREE.Vector3(Math.cos(a) * 0.32, Math.sin(a) * 0.22, Math.sin(a * 1.7) * 0.15), size: 0.07 + (i % 3) * 0.03 };
    });
    const starM = new THREE.SpriteMaterial({ map: starMap, transparent: true, opacity: 0, depthWrite: false });
    const star = new THREE.Sprite(starM);
    scene.add(star);
    disposables.push(puffMap, starMap, starM);

    const lift = (y: number) => new THREE.Matrix4().makeTranslation(0, y, 0);
    let raf = 0, away: THREE.Vector3 | null = null, heading: THREE.Quaternion | null = null, launchAt: THREE.Vector3 | null = null;
    const start = performance.now();
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const s1 = foldCurve(t, TOON.f1), s2 = foldCurve(t, TOON.f2), s3 = foldCurve(t, TOON.f3, true), s4 = foldCurve(t, TOON.f4, true);
      for (const { p, objs } of pieces) {
        let M: THREE.Matrix4;
        if (t < TOON.f2[0]) M = p.c1 ? lift(PAPER_EPS * s1).multiply(rotAbout(p.c1.a, p.c1.dir, Math.PI * s1)) : new THREE.Matrix4();
        else if (t < TOON.f3[0]) M = p.c2 ? lift(PAPER_EPS * (p.L1 + (p.L2 - p.L1) * s2)).multiply(rotAbout(p.c2.a, p.c2.dir, Math.PI * s2)).multiply(p.W1) : lift(PAPER_EPS * p.L1).multiply(p.W1);
        else M = lift(PAPER_EPS * p.L2).multiply(p.W2);
        if (p.c4 && t > TOON.f4[0]) M = rotAbout(p.c4.a, p.c4.dir, -PLANE_WINGS * Math.PI / 180 * s4).multiply(M); // wings flap back out
        if (p.c3 && t > TOON.f3[0]) M = rotAbout(p.c3.a, p.c3.dir, PLANE_HALF * Math.PI / 180 * s3).multiply(M);   // each half snaps up
        objs.forEach((m) => m.matrix.copy(M));
      }
      // the camera swings round to the plane's side, quick and smooth
      const turn = smooth((t - TOON.turn[0]) / (TOON.turn[1] - TOON.turn[0]));
      const phi = SIDE_VIEW * Math.PI / 180 * turn, az = -SIDE_BEHIND * Math.PI / 180 * turn;
      const r = d0 * (1 - 0.1 * turn), ty = 0.05 * clamp01(s3);
      camera.position.set(r * Math.sin(phi) * Math.sin(az), ty + r * Math.cos(phi), r * Math.sin(phi) * Math.cos(az));
      camera.up.set(-Math.cos(phi) * Math.sin(az), Math.sin(phi), -Math.cos(phi) * Math.cos(az));
      camera.lookAt(0, ty, 0);

      // a springy wobble each time a fold lands
      const wob = boing(t, TOON.f3[1], 0.025) + boing(t, TOON.f4[1], 0.035);
      // which way it'll fly: away from you, to the right and up, worked out from where the camera ended up
      if (t > TOON.turn[1] && !away) {
        const fwd = new THREE.Vector3(0, ty, 0).sub(camera.position).normalize();
        const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
        const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
        away = fwd.multiplyScalar(FLIGHT.away).add(right.multiplyScalar(FLIGHT.right)).add(up.multiplyScalar(FLIGHT.up));
        heading = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), away.clone().normalize());
      }
      // hovering, then the wind-up (it turns to face the way it's going, pulls back and squashes), then the zip
      // (it stretches out long and shoots off, faster and faster)
      const wind = smooth((t - TOON.windup[0]) / (TOON.windup[1] - TOON.windup[0]));
      const z = clamp01((t - TOON.zip[0]) / (TOON.zip[1] - TOON.zip[0]));
      const hover = Math.sin(t * 7) * 0.025 * clamp01((t - TOON.f4[1]) * 4) * (1 - wind);
      let sx = 1 + wob, sy = 1 - wob * 0.6, sz = 1 + wob;
      if (away && heading) {
        const zipE = z * z * z;
        const pull = away.clone().normalize().multiplyScalar(-0.35 * wind * (1 - smooth(z * 3)));
        plane.position.copy(away).multiplyScalar(zipE).add(pull).add(new THREE.Vector3(0, hover, 0));
        plane.quaternion.identity().slerp(heading, smooth((t - TOON.f4[1]) / 0.5));
        const squash = wind * (1 - clamp01(z * 4)), stretch = Math.sin(Math.PI * Math.min(1, z * 1.3)) * 0.45 + (z > 0 ? 0.15 : 0);
        sx *= 1 - 0.18 * squash + stretch; sy *= 1 + 0.16 * squash - stretch * 0.35; sz *= 1 + 0.16 * squash - stretch * 0.35;
        if (z > 0 && !launchAt) launchAt = plane.position.clone();
      } else {
        plane.position.set(0, hover, 0);
      }
      plane.scale.set(sx, sy, sz);
      // the puff of smoke at take-off
      for (const pf of puffs) {
        const k = clamp01((t - TOON.zip[0]) / 0.55);
        pf.m.opacity = launchAt && k < 1 ? 1 - easeOut(k) : 0;
        if (launchAt) {
          pf.s.position.copy(launchAt).addScaledVector(pf.dir, easeOut(k));
          pf.s.scale.setScalar(pf.size * (0.4 + easeOutBack(k * 1.6)) * (1 - k * 0.4));
        }
      }
      // the plane shrinks to a dot, then a little star twinkles where it vanished
      const tw = clamp01((t - TOON.twinkle[0]) / (TOON.twinkle[1] - TOON.twinkle[0]));
      if (away && tw > 0) {
        star.position.copy(away);
        starM.opacity = 1;
        starM.rotation = tw * 2.5;
        star.scale.setScalar(Math.sin(Math.PI * tw) * 0.9);
      }
      plane.visible = z < 0.97;
      renderer.render(scene, camera);
      if (t > TOON.twinkle[1] + 0.05) { done.current(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      disposables.forEach((x) => x.dispose());
      textures.forEach((x) => x.dispose());
      front.dispose(); backM.dispose();
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
