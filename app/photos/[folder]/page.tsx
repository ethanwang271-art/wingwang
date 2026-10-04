// app/photos/[folder]/page.tsx  (the folder name in the path is literally [folder], with the brackets)
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFolder } from "../data";
import Gallery from "./Gallery";

export default async function FolderPage({ params }: { params: Promise<{ folder: string }> }) {
  const { folder } = await params;
  let name = folder;
  try { name = decodeURIComponent(folder); } catch {}

  const data = getFolder(name);
  if (!data) notFound();

  // Only show a description you wrote yourself (description.txt), not the auto "A collection of N photos."
  const desc = /^a collection of \d+ photos?\.?$/i.test(data.description.trim()) ? "" : data.description;

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-black text-white">
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
        {desc && <p className="mt-2 text-base text-neutral-400 sm:text-lg">{desc}</p>}

        <div className="mt-8 sm:mt-10">
          <Gallery photos={data.photos} />
        </div>
      </div>
    </main>
  );
}