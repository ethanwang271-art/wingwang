// app/videos/page.tsx  (everything for the videos page lives in this one file)
import type { Metadata } from "next";

const PAGE_BLACK = "11,13,15";

export const metadata: Metadata = {
  title: "videos",
  description: "Videos by Ethan Wang. Coming soon.",
  alternates: { canonical: "/videos" },
  openGraph: { url: "/videos", title: "videos | wingwang" },
};

const CSS = `
html, body { background-color: rgb(${PAGE_BLACK}) !important; }
@keyframes vd-rise { from { opacity: 0; transform: translateY(28px); } }
.vd-rise { animation: vd-rise .9s cubic-bezier(.22,1,.36,1) .12s backwards; }
@media (prefers-reduced-motion: reduce) { .vd-rise { animation: none; } }
`;

export default function VideosPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] text-white" style={{ background: `rgb(${PAGE_BLACK})` }}>
      <style>{CSS}</style>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-12 sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">videos</h1>
        <p className="vd-rise mt-6 text-lg text-neutral-400 sm:text-xl">coming soon</p>
      </div>
    </main>
  );
}
