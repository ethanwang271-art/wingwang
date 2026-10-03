// app/photos/page.tsx
import type { Metadata } from "next";
import FolderCarousel from "./FolderCarousel";
import { getFolders } from "./data";

export const metadata: Metadata = { title: "Photos | wingwang" };

export default function PhotosPage() {
  const folders = getFolders();

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-black text-white">
      {folders.length === 0 ? (
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-4xl font-bold tracking-tight">Photos</h1>
          <div className="mt-8 rounded-3xl border border-dashed border-white/25 p-10 text-center text-neutral-400">
            Add folders of images inside <code>public/photos/</code>, for example{" "}
            <code>public/photos/japan-2024/beach-day.jpg</code>.
          </div>
        </div>
      ) : (
        <FolderCarousel folders={folders} />
      )}
    </main>
  );
}