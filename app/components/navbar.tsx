"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// TODO: replace these with your real details
const INSTAGRAM_URL = "https://instagram.com/etnwingwang";
const LINKEDIN_URL = "https://www.linkedin.com/in/ethan-wang-9206563a1/"; // <- put your LinkedIn profile link here
const EMAIL = "ethan@wingwang.ca";

const pageLinks = [
  { href: "/photos", label: "Photos" },
  { href: "/videos", label: "Videos" },
];

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 11v5" />
      <circle cx="8" cy="8" r="0.75" fill="currentColor" stroke="none" />
      <path d="M12 16v-5" />
      <path d="M12 13.25a2.25 2.25 0 0 1 4.5 0V16" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const iconButton =
    "rounded-full p-2 text-neutral-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    // h-16 is fixed so pages can size themselves with calc(100dvh - 4rem)
    <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-black/80 text-white backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-full max-w-5xl items-center justify-between px-6">
        {/* Left: site label (Comic Sans, with fallbacks for devices that don't have it) */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: '"Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive' }}
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
                        ? "text-white underline decoration-white decoration-2 underline-offset-8"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <span className="mx-1 hidden h-5 w-px bg-white/20 sm:block" aria-hidden="true" />

          <a href={`mailto:${EMAIL}`} aria-label="Email me" className={iconButton}>
            <MailIcon />
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={iconButton}>
            <InstagramIcon />
          </a>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={iconButton}>
            <LinkedInIcon />
          </a>
        </div>
      </nav>
    </header>
  );
}