"use client";
// app/components/navbar.tsx
// Page links on the left, the wingwang logo in the middle, contact and your profiles on the right.
// It has no background and no line, so the page shows through behind it. Its writing is set to white with
// "mix-blend-difference", which shows it as the opposite of whatever is behind: black on the white pages,
// and white when something dark (like the camera) is behind it.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const INSTAGRAM_URL = "https://instagram.com/etnwingwang";
const LINKEDIN_URL = "https://www.linkedin.com/in/ethan-wang-9206563a1/";

// After this long with no mouse, keyboard, scrolling or touching, the browser tab's title changes to IDLE_TITLE.
// It changes back as soon as you do anything. (The navbar is on every page, so this works site-wide.)
const IDLE_MINUTES = 5;
const IDLE_TITLE = "come back!! \u{1F622}";

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

  // the "come back!!" tab title
  useEffect(() => {
    let timer = 0, saved = "";
    const wake = () => {
      if (saved) { document.title = saved; saved = ""; }
      clearTimeout(timer);
      timer = window.setTimeout(() => { saved = document.title; document.title = IDLE_TITLE; }, IDLE_MINUTES * 60 * 1000);
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "scroll", "touchstart", "focus"];
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    wake();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, wake));
      if (saved) document.title = saved;
    };
  }, []);
  const onContact = pathname.startsWith("/contact");

  // a page link: grey, white on hover, white and underlined on the page you're on
  const linkClass = (active: boolean) =>
    `transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
      active ? "text-white underline decoration-1 underline-offset-[6px]" : "text-white hover:opacity-70"
    }`;
  const iconButton =
    "rounded-full p-1 text-white transition hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:p-2";

  return (
    // h-16 is fixed so pages can size themselves with calc(100dvh - 4rem)
    <header className="sticky top-0 z-50 h-16 bg-transparent text-white mix-blend-difference">
      {/* on phones it's two rows (the logo centred on top, the pages and icons underneath), since one row doesn't fit;
          on bigger screens it's one row with the logo in the middle */}
      <nav aria-label="Main" className="grid h-full grid-cols-2 content-center items-center gap-x-3 px-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:px-8">
        {/* left: the pages */}
        <ul className="row-start-2 flex items-center gap-4 text-sm sm:col-start-1 sm:row-start-1 sm:gap-6 sm:text-base">
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
          className="col-span-2 row-start-1 justify-self-center text-lg font-bold leading-7 tracking-tight sm:col-span-1 sm:col-start-2 sm:text-xl"
          style={{ fontFamily: '"Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive' }}
        >
          wingwang
        </Link>

        {/* right: contact and your profiles */}
        <div className="row-start-2 flex items-center justify-end gap-1 sm:col-start-3 sm:row-start-1 sm:gap-3">
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
