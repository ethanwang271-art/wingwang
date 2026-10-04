"use client";
// app/components/ScrollLine.tsx
// A smooth curved line that draws itself down the page as you scroll,
// and finishes with a loop-de-loop at the bottom.
// Put <ScrollLine /> as the first child of the <main className="relative ..."> in app/page.tsx.

import { useEffect, useRef, useState } from "react";

// ---- tweak these ----
const HEAD = 0.7;        // where the tip of the line sits in the window (0 = top, 1 = bottom)
const START = 0.62;      // where the line begins, as a share of the first screen
const SWING = 0.3;       // how far it swings left/right, as a share of page width
const MAX_SWING = 340;   // ...but never more than this many px
const WAVE = 0.9;        // height of one left/right swing, as a share of the window height
const STROKE = 3;        // line thickness in px
const SMOOTH = 8;        // higher = the tip catches up with your scrolling faster

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Built = {
  xs: number[];
  ys: number[];
  cum: number[]; // length of the line up to each point
  wEnd: number;  // index where the swings stop and the loop begins
  yW: number;    // y where the loop begins
  total: number;
  d: string;
};

// Build the whole line as lots of tiny straight steps (so it looks perfectly smooth).
function build(W: number, H: number, vh: number): Built {
  const cx = W / 2;
  const A = Math.min(W * SWING, MAX_SWING);
  const b = clamp(W * 0.1, 38, 90); // loop size
  const a = b * 0.6;                // b > a is what makes the line cross itself
  const span = 2 * Math.PI * a;     // how tall the loop is
  const y0 = vh * START;
  const yW = Math.max(y0 + 400, H - 120 - span);

  // an even number of swings so the line arrives on the left, ready to loop
  const avail = yW - y0;
  const n = 2 * Math.max(1, Math.round(avail / clamp(vh * WAVE, 420, 800) / 2));
  const h = avail / n;

  const xs: number[] = [cx];
  const ys: number[] = [y0];

  // swings: S-curves that are vertical at both ends, so they join without kinks
  let px = cx, py = y0;
  for (let i = 1; i <= n; i++) {
    const nx = cx + (i % 2 ? A : -A);
    const ny = y0 + h * i;
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
  const wEnd = xs.length - 1;

  // the loop: a stretched wave that doubles back on itself
  const cxL = cx - A + b;
  const N = 100;
  for (let k = 1; k <= N; k++) {
    const th = -Math.PI + (2 * Math.PI * k) / N;
    xs.push(cxL + b * Math.cos(th));
    ys.push(yW + a * (th + Math.PI) - b * Math.sin(th));
  }

  const cum = [0];
  for (let i = 1; i < xs.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]));
  }
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join("");
  return { xs, ys, cum, wEnd, yW, total: cum[cum.length - 1], d };
}

export default function ScrollLine() {
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const built = useRef<Built | null>(null);
  const [geo, setGeo] = useState<{ w: number; h: number; d: string } | null>(null);

  // measure the page and (re)build the line
  useEffect(() => {
    const host = svgRef.current?.parentElement;
    if (!host) return;
    let lastW = 0, lastH = 0, lastVh = 0;

    const measure = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      const vh = window.innerHeight;
      // phones change innerHeight while the address bar slides, so ignore small changes
      if (w === lastW && h === lastH && Math.abs(vh - lastVh) < 150) return;
      lastW = w; lastH = h; lastVh = vh;
      if (w < 10 || h < 10) return;
      const b = build(w, h, vh);
      built.current = b;
      setGeo({ w, h, d: b.d });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // draw it as you scroll
  useEffect(() => {
    if (!geo) return;
    const host = svgRef.current?.parentElement;
    if (!host) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = (fi: number) => {
      const b = built.current;
      const line = lineRef.current, glow = glowRef.current, dot = dotRef.current;
      if (!b || !line || !glow || !dot) return;
      const n = b.xs.length;
      const i = clamp(Math.floor(fi), 0, n - 2);
      const t = clamp(fi - i, 0, 1);
      const len = b.cum[i] + (b.cum[i + 1] - b.cum[i]) * t;
      const x = b.xs[i] + (b.xs[i + 1] - b.xs[i]) * t;
      const y = b.ys[i] + (b.ys[i + 1] - b.ys[i]) * t;
      const dash = `${len.toFixed(1)} ${(b.total + 50).toFixed(1)}`;
      const show = len > 1 ? "1" : "0";
      line.style.strokeDasharray = dash;
      glow.style.strokeDasharray = dash;
      line.style.opacity = show;
      glow.style.opacity = show;
      dot.setAttribute("cx", x.toFixed(1));
      dot.setAttribute("cy", y.toFixed(1));
      dot.style.opacity = show;
    };

    // turn "how far down the page the tip is" into a position along the line
    const indexAt = (headY: number, vh: number) => {
      const b = built.current!;
      const { ys, wEnd, yW } = b;
      if (headY <= ys[0]) return 0;
      if (headY < yW) {
        let lo = 0, hi = wEnd;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1;
          if (ys[mid] <= headY) lo = mid; else hi = mid;
        }
        return lo + (headY - ys[lo]) / Math.max(0.0001, ys[hi] - ys[lo]);
      }
      // past the swings: the loop draws over the last bit of scrolling
      const headMax = geo.h - vh * (1 - HEAD);
      const f = clamp((headY - yW) / Math.max(150, headMax - yW), 0, 1);
      return wEnd + f * (b.xs.length - 1 - wEnd);
    };

    if (reduce) {
      paint(built.current!.xs.length - 1);
      return;
    }

    let raf = 0, last = performance.now(), cur = -1;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const vh = window.innerHeight;
      const target = -host.getBoundingClientRect().top + vh * HEAD;
      cur = cur < 0 ? target : cur + (target - cur) * (1 - Math.exp(-dt * SMOOTH));
      paint(indexAt(cur, vh));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [geo]);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0"
      width={geo?.w ?? 0}
      height={geo?.h ?? 0}
    >
      {geo && (
        <>
          {/* faint guide showing where the line is headed */}
          <path d={geo.d} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* soft wide halo */}
          <path ref={glowRef} d={geo.d} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth={STROKE * 4} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0 }} />
          {/* the line itself */}
          <path ref={lineRef} d={geo.d} fill="none" stroke="#fff" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0 }} />
          {/* glowing tip */}
          <circle ref={dotRef} r={STROKE * 2} fill="#fff" style={{ opacity: 0 }} />
        </>
      )}
    </svg>
  );
}