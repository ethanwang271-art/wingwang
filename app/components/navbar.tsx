"use client";
// app/components/navbar.tsx
// Page links on the left, the wingwang logo in the middle, contact and your profiles on the right.
// It has no background and no line, so the page shows through behind it.

import Link from "next/link";
import { usePathname } from "next/navigation";

const INSTAGRAM_URL = "https://instagram.com/etnwingwang";
const LINKEDIN_URL = "https://www.linkedin.com/in/ethan-wang-9206563a1/";

const pageLinks = [
  { href: "/photos", label: "photos" },
  { href: "/videos", label: "videos" },
  { href: "/projects", label: "projects" },
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

// The name must start with a capital letter: React (and the hooks lint rule) only treat
// capitalised functions as components, and usePathname is a hook.
export default function Navbar() {
  const pathname = usePathname();
  const onContact = pathname.startsWith("/contact");

  // a page link: grey, white on hover, white and underlined on the page you're on
  const linkClass = (active: boolean) =>
    `transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
      active ? "text-white underline decoration-1 underline-offset-[6px]" : "text-white hover:opacity-70"
    }`;
  const iconButton =
    "rounded-full p-1.5 text-white transition hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:p-2";

  return (
    // h-16 is fixed so pages can size themselves with calc(100dvh - 4rem)
    <header className="sticky top-0 z-50 h-16 bg-transparent text-white">
      <nav aria-label="Main" className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-8">
        {/* left: the pages */}
        <ul className="flex items-center gap-3 text-sm sm:gap-6 sm:text-base">
          {pageLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link href={link.href} aria-current={active ? "page" : undefined} className={linkClass(active)}>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* middle: the logo, which takes you home (Comic Sans, with fallbacks for devices that don't have it) */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight sm:text-xl"
          style={{ fontFamily: '"Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive' }}
        >
          wingwang
        </Link>

        {/* right: contact and your profiles */}
        <div className="flex items-center justify-end gap-1 sm:gap-3">
          {/* "contact" as a word on bigger screens, a mail icon on phones */}
          <Link href="/contact" aria-current={onContact ? "page" : undefined} className={`hidden text-base sm:mr-2 sm:block ${linkClass(onContact)}`}>
            contact
          </Link>
          <Link href="/contact" aria-label="Contact me" className={`${iconButton} sm:hidden`}>
            <MailIcon />
          </Link>
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
