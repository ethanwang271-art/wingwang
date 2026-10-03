"use client";
// app/page.tsx  (everything for the home page lives in this one file)

import { Fragment, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

// TODO: your email for the Contact tile
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
  transform: translateY(-8px) scale(1.04);
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

.glass-arrow {
  position: absolute; top: 1.5rem; right: 1.25rem;
  width: 1.25rem; height: 1.25rem;
  opacity: .6;
  transition: transform .6s cubic-bezier(.34,1.56,.64,1), opacity .3s ease;
}
.glass-tile:hover .glass-arrow, .glass-tile:focus-visible .glass-arrow { transform: translate(4px, -4px); opacity: 1; }

.glass-title { display: block; font-size: 1.5rem; font-weight: 600; letter-spacing: -.02em; }
.glass-desc { display: block; margin-top: .25rem; font-size: .85rem; color: rgba(255,255,255,.65); }

/* wide variant (used for Contact) */
.glass-wide { flex-direction: row; align-items: center; justify-content: flex-start; gap: 1rem; }
.glass-wide .glass-icon, .glass-wide .glass-arrow { position: static; flex-shrink: 0; }
.glass-wide .glass-text { flex: 1; }
.glass-wide:hover .glass-arrow, .glass-wide:focus-visible .glass-arrow { transform: translateX(4px); }

@keyframes glass-in { from { opacity: 0; transform: translateY(40px) scale(.9); } }

@media (prefers-reduced-motion: reduce) {
  .glass-tile, .glass-icon, .glass-arrow, .glass-tile::after { animation: none; transition-duration: .01s; }
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

/* ---------- Liquid glass tile ---------- */

type TileProps = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  wide?: boolean;
  className?: string;
  delay?: number; // ms, for the staggered entrance
};

function GlassTile({ href, title, description, icon, wide, className = "", delay = 0 }: TileProps) {
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

  const props = {
    className: `glass-tile ${wide ? "glass-wide" : ""} ${className}`,
    style: { animationDelay: `${delay}ms` },
    onPointerMove: onMove,
    onPointerLeave: onLeave,
  };

  const content = (
    <>
      <span className="glass-icon" aria-hidden="true">{icon}</span>
      <span className="glass-text">
        <span className="glass-title">{title}</span>
        <span className="glass-desc">{description}</span>
      </span>
      <svg viewBox="0 0 24 24" className="glass-arrow" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
    </>
  );

  return href.startsWith("mailto:") ? (
    <a href={href} {...props}>{content}</a>
  ) : (
    <Link href={href} {...props}>{content}</Link>
  );
}

/* ---------- Intro text: words rise in one after another ---------- */

function Words({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="hl-word" style={{ "--i": start + i } as CSSProperties}>
            {word}
          </span>
        </Fragment>
      ))}
    </>
  );
}

/* ---------- Icons ---------- */

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-6 w-6",
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
const MailIcon = (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

/* ---------- Page ---------- */

export default function Home() {
  // Put your picture at public/ethan.jpg. If it's missing, the placeholder shows.
  const [photoOk, setPhotoOk] = useState(true);

  return (
    <main className="relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden bg-black text-white">
      <style>{PAGE_CSS + GLASS_CSS}</style>

      {/* Soft shapes behind the glass so the blur has something to catch */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="hl-blob absolute right-[6%] top-[22%] h-72 w-72 rounded-full bg-white/25 blur-3xl" />
        <div className="hl-blob absolute bottom-[8%] left-[8%] h-80 w-80 rounded-full bg-neutral-300/15 blur-3xl" style={{ animationDelay: "-5s" }} />
        <div className="hl-blob absolute left-[42%] top-[4%] h-64 w-64 rounded-full bg-white/10 blur-3xl" style={{ animationDelay: "-9s" }} />
      </div>

      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-12 md:min-h-[calc(100dvh-4rem)] md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
        {/* Left: photo + intro text */}
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
                      priority
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

          <div className="mt-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              <Words text="Hi, I'm Ethan." />
            </h1>
            <div className="hl-line mt-4 h-px w-24 bg-white/50" />
            <p className="mt-4 max-w-sm text-lg text-neutral-400">
              <Words text="Welcome to my corner of the internet. Take a look around." start={4} />
            </p>
          </div>
        </div>

        {/* Right: liquid glass tiles */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          <GlassTile href="/photos" title="Photos" description="some cool still shots" icon={PhotoIcon} className="aspect-square" delay={500} />
          <GlassTile href="/videos" title="Videos" description="some small moments" icon={VideoIcon} className="aspect-square" delay={650} />
          <GlassTile href={`mailto:${EMAIL}`} title="Contact" description="Say hello" icon={MailIcon} wide className="col-span-2 h-28" delay={800} />
        </div>
      </div>
    </main>
  );
}