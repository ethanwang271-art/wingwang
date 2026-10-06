"use client";
// app/photos/FolderCarousel.tsx

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

type Folder = { id: string; title: string; description: string; cover: string; count: number };

// The auto-generated "A collection of 11 photos." text is hidden; only a description you wrote yourself shows
const realDescription = (d?: string) => (d && !/^a collection of \d+ photos?\.?$/i.test(d.trim()) ? d.trim() : "");

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mod = (a: number, m: number) => ((a % m) + m) % m;

// Edit these two lines to change the text at the top of the page
const TITLE = "welcome to my photos :D";
const INTRO = "a slowly growing process, stay tuned for more!";

// How fast the carousel drifts on its own, in pages per second (0.1 = one page every 10 s). 0 turns it off.
const AUTO_SPEED = 0.1;

// Shown in the empty bottom slot when you have an odd number of folders
const PLACEHOLDER = "more soon :)";

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="pc-word" style={{ "--i": i } as CSSProperties}>{w}</span>
        </Fragment>
      ))}
    </>
  );
}

const CSS = `
.pc-tile {
  position: absolute; inset: 0; isolation: isolate; overflow: hidden; display: block; color: #fff;
  border-radius: 22px; background: rgb(11,13,15);
  transition: transform .6s cubic-bezier(.22,1,.36,1), box-shadow .6s ease;
  animation: pc-in .9s cubic-bezier(.34,1.56,.64,1) backwards; animation-delay: var(--d, 0ms);
}
.pc-tile:hover, .pc-tile:focus-visible {
  transform: scale(1.015); outline: none;
  box-shadow: 0 0 0 1px rgba(255,255,255,.28), 0 26px 60px -24px rgba(0,0,0,.9);
}
.pc-tile:active { transform: scale(.99); transition-duration: .2s; }
.pc-tile img { transition: transform 1.2s cubic-bezier(.22,1,.36,1); }
.pc-tile:hover img { transform: scale(1.04); }

.pc-cap {
  position: absolute; inset: auto 0 0 0; z-index: 2;
  padding: 2.75rem 1.5rem 1.2rem;
  background: linear-gradient(to top, rgba(0,0,0,.6), transparent);
  text-shadow: 0 1px 14px rgba(0,0,0,.35);
}
.pc-cap > span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-cap-top { padding: 4rem 1.9rem 1.7rem; }
.pc-t1 { font-size: var(--tt, 2rem); font-weight: 700; letter-spacing: -.02em; line-height: 1.1; }
.pc-s1 { font-size: calc(var(--tt, 2rem) * .42); margin-top: .35em; color: rgba(255,255,255,.8); }
.pc-t2 { font-size: var(--bt, 1.1rem); font-weight: 600; letter-spacing: -.01em; line-height: 1.2; }
.pc-s2 { font-size: calc(var(--bt, 1.1rem) * .8); margin-top: .25em; color: rgba(255,255,255,.7); }

.pc-ph {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  border-radius: 22px; border: 1px dashed rgba(255,255,255,.16); background: rgba(255,255,255,.03);
  color: rgba(255,255,255,.4); font-size: var(--bt, 1.1rem);
}

@media (max-width: 639px) {
  .pc-tile, .pc-ph { border-radius: 18px; }
  .pc-cap { padding: 2.25rem 1.1rem 1rem; }
  .pc-cap-top { padding: 3rem 1.2rem 1.2rem; }
}

.pc-root { touch-action: pan-y; cursor: grab; }
.pc-root[data-drag="1"] { cursor: grabbing; }
.pc-word { display: inline-block; animation: pc-rise .9s cubic-bezier(.22,1,.36,1) backwards; animation-delay: calc(var(--i) * 90ms + 150ms); }
.pc-fade { animation: pc-rise 1s cubic-bezier(.22,1,.36,1) .7s backwards; }

@keyframes pc-in { from { opacity: 0; transform: translateY(40px) scale(.9); } }
@keyframes pc-rise { from { opacity: 0; transform: translateY(.7em); filter: blur(10px); } }
@media (prefers-reduced-motion: reduce) {
  .pc-tile, .pc-word, .pc-fade { animation: none; }
  .pc-tile, .pc-tile img { transition-duration: .01s; }
}
`;

type Slot = { v: number; page: number; clone: boolean; folder?: Folder };

export default function FolderCarousel({ folders }: { folders: Folder[] }) {
  const n = folders.length;

  // Each page = one wide card on the top track + one smaller tile on the bottom track.
  // Page p shows folders[2p] on top and folders[2p + 1] below.
  const P = Math.max(1, Math.ceil(n / 2));
  const loop = P > 1;
  // In loop mode each track mounts enough copies to always fill the screen, so wrapping is seamless.
  const LT = loop ? P * Math.ceil(5 / P) : 1;
  const LB = loop ? P * Math.ceil(9 / P) : 1;

  const topSlots: Slot[] = Array.from({ length: LT }, (_, v) => ({
    v, page: v % P, clone: v >= P, folder: folders[2 * (v % P)],
  }));
  const botSlots: Slot[] = Array.from({ length: LB }, (_, v) => ({
    v, page: v % P, clone: v >= P, folder: folders[2 * (v % P) + 1],
  }));

  const [active, setActive] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const tSlot = useRef<(HTMLDivElement | null)[]>([]);
  const bSlot = useRef<(HTMLDivElement | null)[]>([]);
  const tImg = useRef<(HTMLElement | null)[]>([]);
  const bImg = useRef<(HTMLElement | null)[]>([]);
  const snapRef = useRef<(page: number) => void>(() => {});

  // `pos` is the fractional page number. Dragging changes it; letting go springs to the nearest page.
  // Both tracks read the same `pos`, but each has its own pitch, so the bottom tiles step a shorter
  // distance per page than the top cards.
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = {
      pos: 0, vel: 0, target: 0, v: 0, p0: 0, sx: 0, lt: 0, dp: 1,
      down: false, drag: false, free: false, moved: 0,
      raf: 0, last: 0, idx: 0, wt: 0 as ReturnType<typeof setTimeout> | 0,
      hover: false, sp: 0, rt: 0 as ReturnType<typeof setTimeout> | 0,
      W: 0, gap: 12, rh: 0, wT: 0, wB: 0, pitchT: 1, pitchB: 1,
    };
    const rubber = (p: number) =>
      loop ? p : p < 0 ? p * 0.3 : p > P - 1 ? P - 1 + (p - (P - 1)) * 0.3 : p;

    const place = (
      slots: (HTMLDivElement | null)[],
      imgs: (HTMLElement | null)[],
      L: number,
      pitch: number,
      w: number,
    ) => {
      for (let v = 0; v < slots.length; v++) {
        const el = slots[v];
        if (!el) continue;
        let d = v - s.pos;
        if (loop) d -= L * Math.floor(d / L + 0.5); // wrap to the nearest copy
        const x = d * pitch;
        el.style.visibility = Math.abs(x) < s.W / 2 + w / 2 + 24 ? "visible" : "hidden";
        el.style.transform = `translate3d(${x}px,0,0)`;
        el.style.opacity = String(1 - 0.35 * Math.min(1, Math.abs(d)));
        const im = imgs[v];
        if (im) im.style.transform = `translate3d(${-clamp(d, -1, 1) * 5}%,0,0) scale(1.12)`;
      }
    };

    const render = () => {
      place(tSlot.current, tImg.current, LT, s.pitchT, s.wT);
      place(bSlot.current, bImg.current, LB, s.pitchB, s.wB);
      const idx = loop ? mod(Math.round(s.pos), P) : clamp(Math.round(s.pos), 0, P - 1);
      if (idx !== s.idx) {
        s.idx = idx;
        setActive(idx);
      }
    };

    const tick = (t: number) => {
      const dt = Math.min(0.032, (t - s.last) / 1000 || 0.016);
      s.last = t;
      // slow auto-spin whenever nobody is touching the carousel
      if (loop && AUTO_SPEED > 0 && !s.hover && !s.down && !s.drag && !s.wt) {
        s.sp += (AUTO_SPEED - s.sp) * Math.min(1, dt * 2); // ease in so it never lurches
        s.pos += s.sp * dt;
        s.target = s.pos;
        s.vel = 0;
        render();
        s.raf = requestAnimationFrame(tick);
        return;
      }
      s.sp = 0;
      if (!s.drag && !s.free) {
        // critically damped spring: settles smoothly with no wobble, like iOS paging
        s.vel += (130 * (s.target - s.pos) - 23 * s.vel) * dt;
        s.pos += s.vel * dt;
        if (Math.abs(s.target - s.pos) < 0.0005 && Math.abs(s.vel) < 0.005) {
          s.pos = s.target;
          s.vel = 0;
          render();
          s.raf = 0;
          return;
        }
      }
      render();
      s.raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (!s.raf) {
        s.last = performance.now();
        s.raf = requestAnimationFrame(tick);
      }
    };
    // snap to an absolute (unwrapped) page number
    const snap = (t: number) => {
      s.target = loop ? t : clamp(t, 0, P - 1);
      s.free = false;
      if (reduce) {
        s.pos = s.target;
        s.vel = 0;
      }
      run();
    };
    // go to page g (0..P-1) by the shortest way round
    const goPage = (g: number) => {
      const cur = Math.round(s.target);
      let diff = mod(g - cur, P);
      if (diff > P / 2) diff -= P;
      snap(cur + diff);
    };
    snapRef.current = (g: number) => {
      s.hover = true;
      goPage(g);
      resume(2500);
    };

    const measure = () => {
      const W = root.clientWidth;
      const gap = 12;
      const narrow = W < 640;
      const head = headerRef.current?.offsetHeight ?? 64;

      let B: number, rh: number, bt: number, bh: number;
      if (narrow) {
        // phones: taller cards, with a sliver of the neighbours showing
        B = W * 0.86;
        rh = B * 0.62;
        bt = W * 0.6;
        bh = bt * 0.85;
      } else {
        // top card ~90% of the width, 0.41 as tall as wide; bottom tile ~0.43 of the card width, ~2:1.
        // Shrinks to fit the screen height so the title, both rows and the dots all stay in view.
        const avail = window.innerHeight - 200 - head; // 64 navbar + paddings + gaps + dots + lift room
        const fit = (avail - gap) / (0.41 + 0.43 * 0.49);
        B = Math.min(W * 0.9, clamp(fit, 340, 1400));
        rh = B * 0.41;
        bt = B * 0.43;
        bh = bt * 0.49;
      }

      s.W = W;
      s.gap = gap;
      s.rh = rh;
      s.wT = B;
      s.wB = bt;
      s.pitchT = B + gap;
      s.pitchB = bt + gap;

      stage.style.height = `${rh + gap + bh + 32}px`; // spare room so hovered tiles can lift
      root.style.setProperty("--pl", `${(W - B) / 2}px`); // lines the header up with the top card
      root.style.setProperty("--tt", `${clamp(B * 0.04, narrow ? 22 : 26, 54)}px`);
      root.style.setProperty("--bt", `${clamp(bt * 0.044, 15, 22)}px`);

      tSlot.current.forEach((el) => {
        if (!el) return;
        el.style.width = `${B}px`;
        el.style.height = `${rh}px`;
        el.style.left = `${(W - B) / 2}px`;
        el.style.top = "16px";
      });
      bSlot.current.forEach((el) => {
        if (!el) return;
        el.style.width = `${bt}px`;
        el.style.height = `${bh}px`;
        el.style.left = `${(W - bt) / 2}px`;
        el.style.top = `${16 + rh + gap}px`;
      });
      render();
    };

    const onDown = (e: globalThis.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      s.down = true;
      s.drag = false;
      s.moved = 0;
      s.sx = e.clientX;
      s.lt = e.timeStamp;
      s.v = 0;
      s.p0 = s.pos;
      // grab the bottom row and it follows your finger 1:1; grab the top row and that one does
      const r = stage.getBoundingClientRect();
      s.dp = e.clientY > r.top + 16 + s.rh + s.gap / 2 ? s.pitchB : s.pitchT;
    };
    const onMove = (e: globalThis.PointerEvent) => {
      if (!s.down) return;
      s.moved = Math.abs(e.clientX - s.sx);
      if (!s.drag && s.moved > 6) {
        s.drag = true;
        root.setPointerCapture(e.pointerId);
        root.dataset.drag = "1";
        run();
      }
      if (s.drag) {
        const old = s.pos;
        s.pos = rubber(s.p0 - (e.clientX - s.sx) / s.dp);
        const dt = e.timeStamp - s.lt;
        if (dt > 0) s.v = 0.8 * s.v + 0.2 * (((s.pos - old) / dt) * 1000);
      }
      s.lt = e.timeStamp;
    };
    const onUp = (e: globalThis.PointerEvent) => {
      if (!s.down) return;
      s.down = false;
      if (s.drag) {
        s.drag = false;
        try { root.releasePointerCapture(e.pointerId); } catch {}
        delete root.dataset.drag;
        s.vel = s.v; // keep the finger's momentum going into the spring
        snap(Math.round(s.pos + clamp(s.v * 0.2, -1.5, 1.5)));
        s.hover = true;
        resume(e.pointerType === "mouse" ? 700 : 2500);
      }
    };
    const onClickCapture = (e: MouseEvent) => {
      if (s.moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
      s.moved = 0;
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical scroll stays with the page
      e.preventDefault();
      s.free = false;
      const t = s.target + (e.deltaX * 1.2) / s.pitchT;
      s.target = loop ? t : clamp(t, 0, P - 1); // the spring glides toward it
      if (s.wt) clearTimeout(s.wt);
      s.wt = setTimeout(() => {
        s.wt = 0;
        snap(Math.round(s.target));
        s.hover = true;
        resume(700);
      }, 120);
      run();
    };
    const onKey = (e: KeyboardEvent) => {
      const cur = Math.round(s.target);
      if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") {
        s.hover = true;
        resume(2500);
      }
      if (e.key === "ArrowRight") snap(cur + 1);
      else if (e.key === "ArrowLeft") snap(cur - 1);
      else if (e.key === "Home") goPage(0);
      else if (e.key === "End") goPage(P - 1);
      else return;
      e.preventDefault();
    };

    // Pause while the pointer is over the carousel (or it has keyboard focus), and settle onto the
    // nearest page so the tiles are lined up to click. Resume shortly after the pointer leaves.
    const pause = () => {
      if (s.rt) clearTimeout(s.rt);
      s.rt = 0;
      if (s.hover) return;
      s.hover = true;
      snap(Math.round(s.pos));
    };
    const resume = (delay: number) => {
      if (s.rt) clearTimeout(s.rt);
      s.rt = setTimeout(() => {
        s.rt = 0;
        s.hover = false;
        run();
      }, delay);
    };
    const onEnter = () => pause();
    const onLeave = (e: globalThis.PointerEvent) => resume(e.pointerType === "mouse" ? 700 : 2500);
    const onFocusIn = () => { if (root.matches(":focus-visible")) pause(); };
    const onFocusOut = () => resume(700);

    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener("resize", measure);
    measure();

    stage.addEventListener("pointerenter", onEnter);
    stage.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    root.addEventListener("click", onClickCapture, true);
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("keydown", onKey);
    run(); // start the auto-spin
    return () => {
      cancelAnimationFrame(s.raf);
      if (s.wt) clearTimeout(s.wt);
      if (s.rt) clearTimeout(s.rt);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      stage.removeEventListener("pointerenter", onEnter);
      stage.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("click", onClickCapture, true);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKey);
    };
  }, [P, LT, LB, loop]);

  if (n === 0) return null;

  const renderSlot = (sl: Slot, top: boolean) => {
    const f = sl.folder;
    const desc = realDescription(f?.description);
    const slots = top ? tSlot : bSlot;
    const imgs = top ? tImg : bImg;
    return (
      <div
        key={`${top ? "t" : "b"}${sl.v}`}
        ref={(el) => { slots.current[sl.v] = el; }}
        className="absolute will-change-transform"
        style={{ visibility: "hidden" }}
      >
        {f ? (
          <Link
            href={`/photos/${encodeURIComponent(f.id)}`}
            draggable={false}
            aria-hidden={sl.clone || undefined}
            tabIndex={sl.clone ? -1 : undefined}
            aria-label={`${f.title}, ${f.count} ${f.count === 1 ? "photo" : "photos"}`}
            style={{ "--d": `${150 + (sl.page % 5) * 100 + (top ? 0 : 80)}ms` } as CSSProperties}
            className="pc-tile"
          >
            <span ref={(el) => { imgs.current[sl.v] = el; }} className="absolute inset-0 block will-change-transform">
              <Image
                src={f.cover}
                alt=""
                fill
                draggable={false}
                priority={sl.v === 0}
                sizes={top ? "90vw" : "(min-width: 640px) 40vw, 62vw"}
                className="object-cover"
              />
            </span>
            <span className={`pc-cap ${top ? "pc-cap-top" : ""}`}>
              <span className={top ? "pc-t1" : "pc-t2"}>{f.title}</span>
              {desc && <span className={top ? "pc-s1" : "pc-s2"}>{desc}</span>}
            </span>
          </Link>
        ) : (
          <div className="pc-ph" aria-hidden="true">{PLACEHOLDER}</div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-label="Photo folders. Swipe, or use the left and right arrow keys."
      className="pc-root relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full select-none flex-col justify-center gap-6 overflow-x-clip bg-[#0b0d0f] py-6 outline-none"
    >
      <style>{CSS}</style>

      {/* left edge is set from measure() so the title lines up with the top card */}
      <header ref={headerRef} className="pr-6" style={{ paddingLeft: "var(--pl, 1.5rem)" }}>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <Words text={TITLE} />
        </h1>
        <p className="pc-fade mt-1.5 text-sm text-neutral-400 sm:text-base">{INTRO}</p>
      </header>

      {/* Two tracks on one stage: wide cards on top, smaller tiles below. Each page moves both. */}
      <div ref={stageRef} className="relative">
        {topSlots.map((sl) => renderSlot(sl, true))}
        {botSlots.map((sl) => renderSlot(sl, false))}
      </div>

      {P > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 px-6" role="tablist" aria-label="Choose a page of folders">
          {Array.from({ length: P }, (_, g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={g === active}
              aria-label={`Page ${g + 1}`}
              onClick={() => snapRef.current(g)}
              className={`h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] ${
                g === active ? "w-7 bg-white" : "w-2 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}