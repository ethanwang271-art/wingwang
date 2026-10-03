// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// TODO: replace these with your real details
const INSTAGRAM_URL = "https://instagram.com/etnwingwang";
const EMAIL = "ethan@wingwang.ca";

const pageLinks = [
  { href: "/photos", label: "Photos" },
  { href: "/videos", label: "Videos" },
];

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const iconButton =
    "rounded-full p-2 text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";

  return (
    <div className="sticky top-0 z-50 border-b border-slate-900/10 bg-stone-100/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3"
      >
        {/* Left: site label */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          wingwang
        </Link>

        {/* Right: page links + icons */}
        <div className="flex items-center gap-1 sm:gap-3">
          <ul className="flex items-center gap-1 sm:gap-2">
            {pageLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-2 py-1.5 text-sm font-medium transition sm:px-3 ${
                      active
                        ? "text-slate-900 underline decoration-amber-500 decoration-2 underline-offset-8 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <span
            className="mx-1 hidden h-5 w-px bg-slate-900/15 sm:block dark:bg-white/15"
            aria-hidden="true"
          />

          <a href={`mailto:${EMAIL}`} aria-label="Email me" className={iconButton}>
            <MailIcon />
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className={iconButton}
          >
            <InstagramIcon />
          </a>
        </div>
      </nav>
    </div>
  );
}