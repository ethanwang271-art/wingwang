"use client";
// app/photos/[folder]/Gallery.tsx
// The photo grid for one album: photos fade in as you scroll, grow slightly on hover,
// and open into a full-screen viewer when clicked.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import type { Photo } from "../data";

type Item = Photo & { i: number };

const mod = (a: number, m: number) => ((a % m) + m) % m;

// Row-by-row masonry: each photo goes into the currently shortest column,
// so the order reads left to right across the top, like VSCO.
function columns(photos: Item[], count: number) {
  const cols: Item[][] = Array.from({ length: count }, () => []);
  const heights: number[] = Array(count).fill(0);
  for (const p of photos) {
    const k = heights.indexOf(Math.min(...heights));
    cols[k].push(p);
    heights[k] += p.h / p.w;
  }
  return cols;
}

const CSS = `
.fp-reveal {
  opacity: 0; transform: translateY(24px) scale(.97);
  transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1);
}
.fp-reveal.fp-on { opacity: 1; transform: none; }

.lb { position: fixed; inset: 0; z-index: 100; background: rgba(11,13,15,.92);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); animation: lb-fade .3s ease backwards; }
.lb.lb-out { opacity: 0; transition: opacity .22s ease; }
.lb-frame { animation: lb-fade .3s ease backwards; will-change: transform; }
@keyframes lb-fade { from { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .fp-reveal { transition: none; opacity: 1; transform: none; }
  .lb, .lb-frame { animation: none; }
}
`;

// Fades a photo in the first time it scrolls into view
function Reveal({ delay, children }: { delay: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`fp-reveal ${on ? "fp-on" : ""}`} style={{ transitionDelay: on ? `${delay}ms` : "0ms" }}>
      {children}
    </div>
  );
}

const THUMB_SIZES = "(min-width: 1024px) 330px, (min-width: 640px) 33vw, 50vw";

export default function Gallery({ photos }: { photos: Photo[] }) {
  const n = photos.length;
  const items: Item[] = photos.map((p, i) => ({ ...p, i }));

  const [open, setOpen] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);

  const from = useRef<DOMRect | null>(null); // where the clicked thumbnail was, so the photo can grow out of it
  const trigger = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const closingRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | 0>(0);

  const show = (i: number, el: HTMLElement) => {
    from.current = el.getBoundingClientRect();
    trigger.current = el;
    closingRef.current = false;
    setClosing(false);
    setOpen(i);
  };

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    timer.current = setTimeout(() => {
      closingRef.current = false;
      setClosing(false);
      setOpen(null);
      trigger.current?.focus();
    }, 220);
  }, []);

  const go = useCallback(
    (d: number) => {
      from.current = null;
      setOpen((o) => (o === null ? o : mod(o + d, n)));
    },
    [n],
  );

  const isOpen = open !== null;

  // Esc closes, arrow keys move between photos, and the page behind stops scrolling
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close, go]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // When the viewer first opens, start the photo at the thumbnail's size and position and let it grow
  useLayoutEffect(() => {
    const el = frameRef.current;
    const f = from.current;
    from.current = null;
    if (open === null || !el || !f) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = el.getBoundingClientRect();
    const dx = f.left + f.width / 2 - (to.left + to.width / 2);
    const dy = f.top + f.height / 2 - (to.top + to.height / 2);
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${f.width / to.width})`;
    el.getBoundingClientRect(); // force a layout so the next change animates
    el.style.transition = "transform .55s cubic-bezier(.22,1,.36,1)";
    el.style.transform = "none";
  }, [open]);

  const render = (count: number, cls: string) => (
    <div className={cls}>
      {columns(items, count).map((col, c) => (
        <div key={c} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-5">
          {col.map((p) => (
            <Reveal key={p.src} delay={(p.i % 6) * 70}>
              <button
                type="button"
                onClick={(e) => show(p.i, e.currentTarget)}
                aria-label={`Open photo ${p.i + 1} of ${n}`}
                className="relative block w-full cursor-zoom-in rounded-md transition duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:z-10 hover:scale-[1.03] hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,.9)] focus-visible:z-10 focus-visible:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.w}
                  height={p.h}
                  sizes={THUMB_SIZES}
                  className="h-auto w-full rounded-md bg-neutral-900"
                />
              </button>
            </Reveal>
          ))}
        </div>
      ))}
    </div>
  );

  const cur = open !== null ? photos[open] : null;

  return (
    <>
      <style>{CSS}</style>

      {/* 2 columns on phones, 3 from tablet size up */}
      {render(2, "flex gap-3 sm:hidden")}
      {render(3, "hidden gap-5 sm:flex")}

      {cur && open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${open + 1} of ${n}`}
          className={`lb ${closing ? "lb-out" : ""}`}
          onClick={close}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50 && n > 1) go(dx < 0 ? 1 : -1);
          }}
        >
          {/* the photo, as large as the screen allows */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              key={open}
              ref={frameRef}
              className="lb-frame pointer-events-auto relative overflow-hidden rounded-lg bg-neutral-900"
              style={{
                aspectRatio: `${cur.w} / ${cur.h}`,
                width: `min(94vw, ${((88 * cur.w) / cur.h).toFixed(2)}dvh)`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* the small version is already loaded, so it shows instantly while the sharp one loads over it */}
              <Image src={cur.src} alt="" fill sizes={THUMB_SIZES} className="object-contain" />
              <Image
                src={cur.src}
                alt={cur.alt}
                fill
                sizes="100vw"
                quality={90}
                className="object-contain"
                style={{ opacity: 0, transition: "opacity .35s ease" }}
                onLoad={(e) => { e.currentTarget.style.opacity = "1"; }}
              />
            </div>
          </div>

          <button
            ref={closeBtn}
            type="button"
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {n > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:grid"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:grid"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-sm tabular-nums text-neutral-400">
            {open + 1} / {n}
          </div>

          {/* load the neighbours in the background so arrowing through is instant */}
          {n > 2 &&
            [mod(open + 1, n), mod(open - 1, n)].map((j) => (
              <Image key={j} src={photos[j].src} alt="" width={photos[j].w} height={photos[j].h} sizes="100vw" quality={90} loading="eager" className="hidden" />
            ))}
        </div>
      )}
    </>
  );
}