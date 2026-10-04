"use client";
// app/page.tsx  (everything for the home page lives in this one file)

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

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

/* frosted frame around the photo */
.hl-frame {
  border-radius: 2.25rem;
  padding: .5rem;
  background: linear-gradient(145deg, rgba(255,255,255,.16), rgba(255,255,255,.04));
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255,255,255,.2);
  box-shadow: inset 0 1px 1px rgba(255,255,255,.5), 0 24px 60px -12px rgba(0,0,0,.7);
}

@media (prefers-reduced-motion: reduce) {
  .hl-word, .hl-line, .hl-blob, .hl-float, .hl-photo { animation: none; }
}
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
  { in: [0.66, 0.78], out: [0.93, 0.995] }, // im a 16 yr old tryna do something
] as const;

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
      <style>{PAGE_CSS + GLASS_CSS + INTRO_CSS}</style>

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
              im a 16 yr old tryna do something
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
              <div className="hl-float">
                <div className="hl-frame">
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