// app/photos/[folder]/page.tsx  (the folder name in the path is literally [folder], with the brackets)
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFolder, type Photo } from "../data";

type Item = Photo & { i: number };

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
.fp-up { animation: fp-up .8s cubic-bezier(.22,1,.36,1) backwards; }
@keyframes fp-up { from { opacity: 0; transform: translateY(24px); } }
@media (prefers-reduced-motion: reduce) { .fp-up { animation: none; } }
`;

export default async function FolderPage({ params }: { params: Promise<{ folder: string }> }) {
  const { folder } = await params;
  let name = folder;
  try { name = decodeURIComponent(folder); } catch {}

  const data = getFolder(name);
  if (!data) notFound();

  const photos: Item[] = data.photos.map((p, i) => ({ ...p, i }));

  const render = (count: number, cls: string) => (
    <div className={cls}>
      {columns(photos, count).map((col, c) => (
        <div key={c} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-5">
          {col.map((p) => (
            <Image
              key={p.src}
              src={p.src}
              alt={p.alt}
              width={p.w}
              height={p.h}
              sizes="(min-width: 1024px) 330px, (min-width: 640px) 33vw, 50vw"
              className={`h-auto w-full rounded-md bg-neutral-900 ${p.i < 6 ? "fp-up" : ""}`}
              style={p.i < 6 ? { animationDelay: `${p.i * 70}ms` } : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-black text-white">
      <style>{CSS}</style>
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        <Link
          href="/photos"
          className="inline-flex items-center gap-1 text-sm text-neutral-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Photos
        </Link>

        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{data.title}</h1>
        <p className="mt-2 text-base text-neutral-400 sm:text-lg">{data.description}</p>

        <div className="mt-8 sm:mt-10">
          {/* 2 columns on phones, 3 from tablet size up */}
          {render(2, "flex gap-3 sm:hidden")}
          {render(3, "hidden gap-5 sm:flex")}
        </div>
      </div>
    </main>
  );
}