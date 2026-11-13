"use client";
// app/components/cursor.tsx
// The custom cursor: a blue dot with a white ring that drifts after it and grows over links and buttons.
// It's added once in app/layout.tsx, so every page has it. Only on computers with a mouse; phones keep their normal touch.

import { useEffect, useRef, type CSSProperties } from "react";

// ---- tweak these ----
const CURSOR_BLUE = "100,159,255"; // r,g,b of the dot (the site blue, #649FFF)
const CURSOR_DOT = 8;             // size of the dot in px
const CURSOR_RING = 38;           // size of the ring in px
const CURSOR_FOLLOW = 9;          // how quickly the ring catches up with the dot (lower = lazier, more delay)
const CURSOR_HOVER_SCALE = 1.7;   // the ring grows this much over links and buttons (1 = never grows)

// hide the normal arrow (only on devices with a real mouse)
const CURSOR_CSS = `
@media (hover: hover) and (pointer: fine) {
  html, html * { cursor: none !important; }
}
.cursor-dot, .cursor-ring { transition: background-color .25s ease, border-color .25s ease, box-shadow .25s ease; }
`;

export default function Cursor() {
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
      <style>{CURSOR_CSS}</style>
      <div ref={ringRef} aria-hidden="true" className="cursor-ring" style={{ ...base, width: CURSOR_RING, height: CURSOR_RING, border: "1px solid rgba(255,255,255,.75)", mixBlendMode: "difference" }} />
      <div ref={dotRef} aria-hidden="true" className="cursor-dot" style={{ ...base, width: CURSOR_DOT, height: CURSOR_DOT, background: `rgb(${CURSOR_BLUE})`, boxShadow: `0 0 10px rgba(${CURSOR_BLUE},.9)` }} />
    </>
  );
}
