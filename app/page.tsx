// app/page.tsx
import Link from "next/link";
// import Image from "next/image"; // uncomment when you add your photo

const links = [
  {
    href: "/photos",
    title: "Photos",
    description: "Albums and snapshots, sorted by trip and year.",
  },
  {
    href: "/videos",
    title: "Videos",
    description: "Clips, edits, and longer recordings.",
  },
  {
    href: "/about",
    title: "About me",
    description: "Who I am and what I'm working on.",
  },
  {
    href: "/contact",
    title: "Contact",
    description: "Send me a message.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-6 py-12 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-16">
        {/* Photo */}
        <div className="mx-auto w-full max-w-sm md:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-slate-200 ring-1 ring-slate-900/10 dark:bg-slate-800 dark:ring-white/10">
            {/*
              Put your photo at /public/me.jpg, then replace the placeholder
              below with:

              <Image
                src="/me.jpg"
                alt="Photo of me"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 768px) 40vw, 90vw"
              />
            */}
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-slate-500 dark:text-slate-400">
              <svg
                viewBox="0 0 24 24"
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" />
              </svg>
              <p className="text-sm">Your photo goes here</p>
            </div>
          </div>
        </div>

        {/* Intro + navigation */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Hi, I&apos;m Your Name
          </h1>
          <p className="mt-3 max-w-md text-lg text-slate-600 dark:text-slate-400">
            Welcome to my site. Pick a section to start browsing.
          </p>

          <nav aria-label="Main" className="mt-10">
            <ul className="divide-y divide-slate-900/10 border-y border-slate-900/10 dark:divide-white/10 dark:border-white/10">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between gap-4 py-5 outline-none transition focus-visible:bg-amber-200/40 dark:focus-visible:bg-amber-300/10"
                  >
                    <span>
                      <span className="block text-xl font-semibold group-hover:underline group-hover:decoration-amber-500 group-hover:decoration-2 group-hover:underline-offset-4">
                        {link.title}
                      </span>
                      <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">
                        {link.description}
                      </span>
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}