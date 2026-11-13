// app/projects/page.tsx  (everything for the projects page lives in this one file)
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

// ---- Your projects: edit these ----
// One block per project, newest first. For each one:
//   title        the project's name
//   date         when you made it, for example "mar '26"
//   description  one or two sentences about it
//   media        a picture or a video for the top of the card. Put the file in public/projects/
//                and write its path here, for example "/projects/vit.jpg" or "/projects/vit.mp4".
//                Videos play on their own, silently, on a loop. Leave it "" for an empty box.
//   link         optional: where clicking the card goes (a full web address, or a page on your site).
//                Leave it "" to make the card not clickable.
const PROJECTS: { title: string; date: string; description: string; media: string; link: string }[] = [
  {
    title: "aeon salmon v1",
    date: "nov '26",
    description: "a small desk buddy with a face, built around a raspberry pi pico 2 w: a wi-fi clock, alarm and timer that gets dizzy when you shake it. version 1, parts ordered, not built yet.",
    media: "/projects/robot-v1.png",
    link: "/projects/robot",
  },
  // Copy this block (without the // at the start of each line) to add a project:
  // {
  //   title: "my project",
  //   date: "mar '26",
  //   description: "One or two sentences about what it is and what it does.",
  //   media: "/projects/my-project.jpg",
  //   link: "",
  // },
];

// ---- colours (same as the rest of the site) ----
const PAGE_BG = "255,255,255"; // the page's background (white)
const BLUE = "100,159,255"; // the hand-drawn underline and circle

export const metadata: Metadata = {
  title: "projects",
  description: "Things Ethan Wang has made: projects, tools and experiments.",
  alternates: { canonical: "/projects" },
  openGraph: { url: "/projects", title: "projects | wingwang" },
};

const CSS = `
html, body { background-color: rgb(${PAGE_BG}) !important; }

/* cards rise in one after another when the page opens */
@keyframes pj-rise { from { opacity: 0; transform: translateY(28px); } }
.pj-card { animation: pj-rise .9s cubic-bezier(.22,1,.36,1) backwards; animation-delay: calc(var(--i, 0) * 110ms + 120ms); }

/* the picture zooms in a little when you hover the card */
.pj-media { transition: transform .9s cubic-bezier(.22,1,.36,1); }
.pj-card:hover .pj-media, .pj-card:focus-visible .pj-media { transform: scale(1.035); }

/* the hand-drawn marks draw themselves in, and redraw when you hover */
.pj-ink path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: pj-draw .8s cubic-bezier(.65,0,.35,1) forwards; animation-delay: calc(var(--i, 0) * 110ms + 700ms); }
@keyframes pj-draw { to { stroke-dashoffset: 0; } }
.pj-card:hover .pj-ink path { animation: pj-redraw .7s cubic-bezier(.65,0,.35,1); }
@keyframes pj-redraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }

@media (prefers-reduced-motion: reduce) {
  .pj-card, .pj-ink path { animation: none !important; stroke-dashoffset: 0; }
  .pj-media { transition: none; }
}
`;

// a wobbly hand-drawn line under the title
function Underline() {
  return (
    <svg className="pj-ink pointer-events-none absolute -bottom-2 left-0 h-3 w-full overflow-visible" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
      <path d="M1 7 C 18 4, 34 9, 52 6 S 86 4, 99 6.5" pathLength={1} fill="none" stroke={`rgb(${BLUE})`} strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// a hand-drawn loop around the date
function Circle() {
  return (
    <svg className="pj-ink pointer-events-none absolute -inset-x-2.5 -inset-y-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+1.25rem)] overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
      <path d="M14 6 C 40 1, 80 0, 94 12 C 102 22, 98 40, 74 46 C 50 51, 18 49, 6 38 C -2 29, 2 12, 18 5 C 22 3.5, 26 3, 30 3" pathLength={1} fill="none" stroke={`rgb(${BLUE})`} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Media({ src, title }: { src: string; title: string }) {
  if (!src) {
    return (
      <div className="pj-media flex h-full w-full items-center justify-center text-sm text-neutral-400">
        add a picture or video in PROJECTS
      </div>
    );
  }
  if (/\.(mp4|webm|mov)$/i.test(src)) {
    return <video className="pj-media h-full w-full object-cover" src={src} autoPlay muted loop playsInline preload="metadata" aria-label={title} />;
  }
  return <Image className="pj-media object-cover" src={src} alt={title} fill sizes="(min-width: 768px) 45vw, 92vw" />;
}

export default function ProjectsPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] text-neutral-900" style={{ background: `rgb(${PAGE_BG})` }}>
      <style>{CSS}</style>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-12 sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">projects</h1>

        {/* while there are no projects in PROJECTS yet */}
        {PROJECTS.length === 0 && (
          <p className="pj-card mt-6 text-lg text-neutral-600 sm:text-xl">coming soon</p>
        )}

        <div className="mt-10 grid gap-x-12 gap-y-16 sm:mt-12 md:grid-cols-2 md:gap-y-24">
          {PROJECTS.map((p, i) => {
            const inner = (
              <>
                <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-neutral-200">
                  <Media src={p.media} title={p.title} />
                </div>
                <div className="mt-6 flex items-baseline justify-between gap-6">
                  <h2 className="relative text-xl font-bold tracking-tight sm:text-2xl">
                    {p.title}
                    <Underline />
                  </h2>
                  <span className="relative shrink-0 px-1 text-lg text-neutral-600 sm:text-xl">
                    {p.date}
                    <Circle />
                  </span>
                </div>
                <p className="mt-4 max-w-prose text-base leading-relaxed text-neutral-600 sm:text-lg">{p.description}</p>
              </>
            );
            const style = { "--i": i } as CSSProperties;
            if (!p.link) {
              return <article key={i} className="pj-card" style={style}>{inner}</article>;
            }
            const external = /^https?:\/\//.test(p.link);
            return (
              <article key={i} className="pj-card" style={style}>
                {external ? (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black">
                    {inner}
                  </a>
                ) : (
                  <Link href={p.link} className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black">
                    {inner}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
