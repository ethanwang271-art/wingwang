"use client";
// app/components/iris.tsx
// The iris wipe: when you go between photos, videos and projects, a camera aperture closes over the page,
// the next page loads behind it, and the aperture opens again on the new page.
// It's added once in app/layout.tsx, so it works on every page by itself.

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// ---- tweak these ----
const IRIS_SECTIONS = ["/photos", "/videos", "/projects"]; // going between any two of these plays the iris (album pages count as photos)
const IRIS_CLOSE = 0.5;               // seconds for the blades to close
const IRIS_OPEN = 0.6;                // seconds for them to open again on the new page
const IRIS_BLADES = 9;                // how many blades (the same as the lens on the home page)
const BLADE_LINE = "255,190,110";     // r,g,b of the blades' edges (the amber from the home page)
const OPENING_LINE = "255,255,255";   // r,g,b of the edge of the opening
const PAGE_BLACK = "11,13,15";        // r,g,b of the blades themselves (the page's black)
const BLADE_CURVE = 1.1;              // how much each blade's edge curves (0 = straight lines; same as the home page)

// which of the sections above a page belongs to (or none)
const sectionOf = (path: string) => IRIS_SECTIONS.find((s) => path === s || path.startsWith(s + "/"));

// draw the aperture with its opening at radius r (0 = fully shut, 1 = fully open, off the edges of the screen)
function drawIris(ctx: CanvasRenderingContext2D, W: number, H: number, open: number) {
  const N = IRIS_BLADES, cx = W / 2, cy = H / 2;
  // fully open, the opening has to clear the corners of the screen
  const R = (Math.hypot(W, H) / 2 / Math.cos(Math.PI / N)) * 1.04;
  const r = R * open;
  const rot = -0.25 + (1 - open) * 1.6; // the blades turn as they close, like a real lens
  const v = Array.from({ length: N }, (_, i) => {
    const a = rot + (i / N) * Math.PI * 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  ctx.clearRect(0, 0, W, H);

  // the blades: everything outside the opening
  const blades = new Path2D();
  blades.rect(0, 0, W, H);
  v.forEach((p, i) => (i ? blades.lineTo(p.x, p.y) : blades.moveTo(p.x, p.y)));
  blades.closePath();
  ctx.fillStyle = `rgb(${PAGE_BLACK})`;
  ctx.fill(blades, "evenodd");
  ctx.fillStyle = `rgba(${BLADE_LINE},0.035)`;
  ctx.fill(blades, "evenodd");

  // each blade's edge carries on from the corner of the opening and sweeps round in a smooth curve, out past the screen
  const edges = new Path2D();
  const far = R * 1.3;
  for (let i = 0; i < N; i++) {
    const a = v[i], b = v[(i + 1) % N];
    let dx = b.x - a.x, dy = b.y - a.y;
    const dl = Math.hypot(dx, dy);
    if (dl < 1e-6) { // fully shut: all corners meet in the middle, so use the direction the blade points
      const ang = rot + ((i + 0.5) / N) * Math.PI * 2 + Math.PI / 2;
      dx = Math.cos(ang); dy = Math.sin(ang);
    } else { dx /= dl; dy /= dl; }
    // walk outwards from the corner, turning a little towards pointing straight out at every step
    let x = b.x - cx, y = b.y - cy;
    const turn = Math.sign(dx * y - dy * x) || 1;
    const step = far / 60, k = (BLADE_CURVE / far) * step * turn;
    edges.moveTo(b.x, b.y);
    for (let n = 0; n < 400 && Math.hypot(x, y) < far; n++) {
      let diff = Math.atan2(y, x) - Math.atan2(dy, dx);
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const r = Math.abs(diff) < Math.abs(k) ? diff : k;
      const c = Math.cos(r), s = Math.sin(r);
      [dx, dy] = [dx * c - dy * s, dx * s + dy * c];
      x += dx * step; y += dy * step;
      edges.lineTo(cx + x, cy + y);
    }
  }
  const glow = (path: Path2D, col: string, a: number, width: number) => {
    ctx.strokeStyle = `rgba(${col},${(a * 0.14).toFixed(3)})`;
    ctx.lineWidth = width * 3.5;
    ctx.stroke(path);
    ctx.strokeStyle = `rgba(${col},${a.toFixed(3)})`;
    ctx.lineWidth = width;
    ctx.stroke(path);
  };
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  glow(edges, BLADE_LINE, 0.8, 1.2);
  if (r > 0.5) {
    const hole = new Path2D();
    v.forEach((p, i) => (i ? hole.lineTo(p.x, p.y) : hole.moveTo(p.x, p.y)));
    hole.closePath();
    glow(hole, OPENING_LINE, 0.9, 1.4);
  }
}

const easeIn = (t: number) => t * t * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function IrisTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // where the wipe is up to: "closing" over the old page, "shut" while the new page loads, "opening" on the new page
  const state = useRef<{ phase: "idle" | "closing" | "shut" | "opening"; from: string; raf: number; giveUp: number }>({
    phase: "idle", from: "", raf: 0, giveUp: 0,
  });
  const pathRef = useRef(pathname);
  const openRef = useRef<() => void>(() => {});

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const s = state.current;
    let W = 0, H = 0;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // run the blades from one opening to another over `secs` seconds, then call done
    const animate = (from: number, to: number, secs: number, ease: (t: number) => number, done: () => void) => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / 1000 / secs);
        drawIris(ctx, W, H, from + (to - from) * ease(t));
        if (t < 1) s.raf = requestAnimationFrame(step);
        else done();
      };
      cancelAnimationFrame(s.raf);
      s.raf = requestAnimationFrame(step);
    };
    const finish = () => {
      s.phase = "idle";
      ctx.clearRect(0, 0, W, H);
      cv.style.display = "none";
    };
    openRef.current = () => {
      if (s.phase !== "shut") return;
      clearTimeout(s.giveUp);
      s.phase = "opening";
      // wait two frames so the new page has painted under the blades
      requestAnimationFrame(() => requestAnimationFrame(() => animate(0, 1, IRIS_OPEN, easeOut, finish)));
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      const here = sectionOf(location.pathname), there = sectionOf(url.pathname);
      if (!here || !there || here === there) return; // only between two different sections
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // just go there normally
      // take over the click (before the link itself sees it) and play the iris instead
      e.preventDefault();
      e.stopPropagation();
      if (s.phase !== "idle") return;
      const href = url.pathname + url.search + url.hash;
      router.prefetch(href);
      s.phase = "closing";
      s.from = location.pathname;
      size();
      cv.style.display = "block";
      animate(1, 0, IRIS_CLOSE, easeIn, () => {
        s.phase = "shut";
        router.push(href);
        // if the new page never arrives, open up again anyway rather than leave the screen black
        s.giveUp = window.setTimeout(() => openRef.current(), 4000);
        if (pathRef.current !== s.from) openRef.current();
      });
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener("resize", size);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("resize", size);
      cancelAnimationFrame(s.raf);
      clearTimeout(s.giveUp);
    };
  }, [router]);

  // the new page has arrived: open the blades
  useEffect(() => {
    pathRef.current = pathname;
    if (state.current.phase === "shut" && pathname !== state.current.from) openRef.current();
  }, [pathname]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-auto fixed inset-0 z-[60] h-full w-full"
      style={{ display: "none" }}
    />
  );
}
