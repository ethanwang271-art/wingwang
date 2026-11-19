// app/photos/[folder]/page.tsx  (the folder name in the path is literally [folder], with the brackets)
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFolder, getFolders } from "../data";
import Gallery from "./Gallery";

type Props = { params: Promise<{ folder: string }> };

const folderName = async (params: Props["params"]) => {
  const { folder } = await params;
  try { return decodeURIComponent(folder); } catch { return folder; }
};
// Only show a description you wrote yourself (description.txt), not the auto "A collection of N photos."
const ownDescription = (d: string) => (/^a collection of \d+ photos?\.?$/i.test(d.trim()) ? "" : d);

// build every album page ahead of time (when the site is built), so they open instantly
export function generateStaticParams() {
  return getFolders().map((f) => ({ folder: f.id }));
}

// each album gets its own title and description. Its share picture (the cover photo with the album's name)
// is made by opengraph-image.tsx, next to this file
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = await folderName(params);
  const data = getFolder(name);
  if (!data) return {};
  const desc = ownDescription(data.description);
  const description = `${name}: ${data.photos.length} photos by Ethan Wang.${desc ? ` ${desc}` : ""}`;
  const path = `/photos/${encodeURIComponent(name)}`;
  return {
    title: name,
    description,
    alternates: { canonical: path },
    openGraph: { url: path, title: `${name} | wingwang`, description },
    // (leaving out a picture here lets x / twitter use the album's own share picture instead of the site's)
    twitter: { card: "summary_large_image", title: `${name} | wingwang`, description },
  };
}

export default async function FolderPage({ params }: Props) {
  const name = await folderName(params);
  const data = getFolder(name);
  if (!data) notFound();
  const desc = ownDescription(data.description);

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-white text-neutral-900">
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        <Link
          href="/photos"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 transition hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Photos
        </Link>

        {/* the folder's own name, exactly as written (so lowercase stays lowercase) */}
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{name}</h1>
        {desc && <p className="mt-2 text-base text-neutral-600 sm:text-lg">{desc}</p>}

        <div className="mt-8 sm:mt-10">
          <Gallery photos={data.photos} />
        </div>
      </div>
    </main>
  );
}