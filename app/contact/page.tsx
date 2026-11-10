"use client";
// app/contact/page.tsx  (the page the "Contact me" button on the home page opens; everything for it lives in this one file)

import { useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";

// ---- Contact page: edit these ----
const EMAIL = "ethan@wingwang.ca"; // shown on the page. (Messages from the form are delivered to the address inside app/api/contact/route.ts)
const CONTACT_TITLE = "contact";
const CONTACT_BLURB = "Tell me a little about what you're working on and I'll get back to you soon.";
const PHONE: string = ""; // optional, for example "647-555-0123". Leave it empty to hide the phone line
// your links (the same ones as in the navbar). Any with an empty link "" is hidden
const SOCIALS: { label: string; href: string }[] = [
  { label: "Instagram", href: "https://instagram.com/etnwingwang" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/ethan-wang-9206563a1/" },
];

// ---- colours and glow (same as the home page) ----
const NAVBAR = 64;             // navbar height in px (h-16)
const PAGE_BLACK = "11,13,15";
const BLUE = "100,159,255";
const GLOW_X = 100;            // which side the glow comes from: 100 = right edge, 0 = left edge
const GLOW_STRENGTH = 0.42;    // 0 = off, 1 = very strong
const SIDE_GLOW = `radial-gradient(ellipse 60% 90% at ${GLOW_X}% 55%, rgba(${BLUE},${GLOW_STRENGTH}), transparent 70%)`;

const CSS = `
html, body, .bg-black { background-color: rgb(${PAGE_BLACK}) !important; }

@keyframes cp-rise { from { opacity: 0; transform: translateY(.7em); filter: blur(10px); } }
.cp-in { animation: cp-rise .9s cubic-bezier(.22,1,.36,1) backwards; animation-delay: calc(var(--i, 0) * 120ms + 150ms); }
@media (prefers-reduced-motion: reduce) { .cp-in { animation: none; } }

.cf-eyebrow { font-size: .8rem; letter-spacing: .25em; text-transform: uppercase; color: rgba(255,255,255,.45); }
.cf-card {
  border-radius: 2rem;
  padding: 1.5rem;
  background: linear-gradient(145deg, rgba(255,255,255,.09), rgba(255,255,255,.03));
  border: 1px solid rgba(255,255,255,.12);
  box-shadow: inset 0 1px 1px rgba(255,255,255,.25), 0 30px 70px -20px rgba(0,0,0,.8);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  backdrop-filter: blur(24px) saturate(160%);
}
@media (min-width: 640px) { .cf-card { padding: 2rem; border-radius: 2.25rem; } }
.cf-label { display: block; margin-bottom: .5rem; font-size: .95rem; color: rgba(255,255,255,.6); }
.cf-input {
  display: block; width: 100%;
  border-radius: 1.1rem;
  padding: .95rem 1.1rem;
  background: rgba(0,0,0,.35);
  border: 1px solid rgba(255,255,255,.1);
  color: #fff;
  font: inherit; font-size: 1.05rem;
  outline: none;
  transition: border-color .25s ease, box-shadow .25s ease, background .25s ease;
}
.cf-input::placeholder { color: rgba(255,255,255,.35); }
.cf-input:focus { border-color: rgba(${BLUE}, .8); box-shadow: 0 0 0 3px rgba(${BLUE}, .22); background: rgba(0,0,0,.5); }
textarea.cf-input { resize: vertical; min-height: 9rem; }
.cf-send {
  display: block; width: 100%;
  border: 0; border-radius: 9999px;
  padding: 1rem 1.5rem;
  background: linear-gradient(#ffffff, #ececec);
  color: rgb(${PAGE_BLACK});
  font: inherit; font-size: 1.05rem; font-weight: 500;
  box-shadow: 0 10px 30px -12px rgba(255,255,255,.35);
  cursor: pointer;
  transition: transform .3s ease, box-shadow .3s ease, opacity .3s ease;
}
.cf-send:hover:not(:disabled), .cf-send:focus-visible { transform: translateY(-2px); box-shadow: 0 16px 40px -10px rgba(${BLUE}, .6); outline: none; }
.cf-send:disabled { opacity: .6; cursor: default; }
.cf-pill {
  display: inline-block;
  border-radius: 9999px;
  border: 1px solid rgba(255,255,255,.18);
  padding: .6rem 1.2rem;
  color: rgba(255,255,255,.85);
  text-decoration: none;
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: background .3s ease, border-color .3s ease, transform .3s ease;
}
.cf-pill:hover, .cf-pill:focus-visible { background: rgba(255,255,255,.08); border-color: rgba(${BLUE}, .8); transform: translateY(-2px); outline: none; }

/* the hidden field that catches spam bots (real people never see it) */
.cf-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
`;

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  // sends the form to /api/contact (app/api/contact/route.ts), which emails it to you with Resend
  const onSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget; // grab it now: it's gone after the await below
    const data = Object.fromEntries(new FormData(form));

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "something went wrong, please try again");
      form.reset();
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong, please try again");
      setStatus("error");
    }
  };

  return (
    <main className="relative min-h-[calc(100dvh-4rem)] overflow-hidden text-white" style={{ background: `rgb(${PAGE_BLACK})` }}>
      <style>{CSS}</style>

      {/* blue glow bleeding in from the side (fixed, so it stays put while you scroll) */}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{ position: "fixed", left: 0, right: 0, bottom: 0, top: NAVBAR, background: SIDE_GLOW }}
      />

      <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-8 sm:pt-10 md:pb-32">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-neutral-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Home
        </Link>

        <div className="mt-10 grid items-start gap-12 md:mt-14 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
          {/* left: title, short blurb, email, phone, socials */}
          <div>
            <h1 className="cp-in text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">{CONTACT_TITLE}</h1>
            <p className="cp-in mt-6 max-w-md text-lg leading-relaxed text-neutral-400" style={{ "--i": 1 } as CSSProperties}>
              {CONTACT_BLURB}
            </p>

            <div className="cp-in mt-10" style={{ "--i": 2 } as CSSProperties}>
              <p className="cf-eyebrow">email</p>
              <a href={`mailto:${EMAIL}`} className="mt-3 inline-block text-xl text-white transition hover:text-neutral-300">
                {EMAIL}
              </a>
            </div>

            {PHONE && (
              <div className="cp-in mt-8" style={{ "--i": 3 } as CSSProperties}>
                <p className="cf-eyebrow">phone</p>
                <a href={`tel:${PHONE.replace(/[^+\d]/g, "")}`} className="mt-3 inline-block text-xl text-white transition hover:text-neutral-300">
                  {PHONE}
                </a>
              </div>
            )}

            <div className="cp-in mt-10 flex flex-wrap gap-3" style={{ "--i": 4 } as CSSProperties}>
              {SOCIALS.filter((s) => s.href).map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="cf-pill">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* right: the form (or a thank-you after it is sent) */}
          {status === "sent" ? (
            <div role="status" className="cf-card cp-in text-center" style={{ "--i": 2 } as CSSProperties}>
              <p className="text-3xl font-bold tracking-tight">Message sent!</p>
              <p className="mt-3 text-neutral-400">Thanks for reaching out, I&rsquo;ll get back to you soon.</p>
              <button type="button" className="cf-pill mt-8" onClick={() => setStatus("idle")}>
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={onSend} className="cf-card cp-in" style={{ "--i": 2 } as CSSProperties}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="cf-name" className="cf-label">Name</label>
                  <input id="cf-name" name="name" type="text" required maxLength={100} autoComplete="name" placeholder="Your name" className="cf-input" />
                </div>
                <div>
                  <label htmlFor="cf-email" className="cf-label">Email</label>
                  <input id="cf-email" name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@example.com" className="cf-input" />
                </div>
                <div>
                  <label htmlFor="cf-message" className="cf-label">Message</label>
                  <textarea id="cf-message" name="message" required maxLength={5000} rows={5} placeholder="Tell me about your project" className="cf-input" />
                </div>
              </div>

              {/* spam trap: hidden from people, bots tend to fill it in */}
              <div className="cf-hp" aria-hidden="true">
                <label htmlFor="cf-website">Website</label>
                <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <button type="submit" disabled={status === "sending"} className="cf-send mt-6">
                {status === "sending" ? "Sending..." : "Send message"}
              </button>
              <p role="alert" aria-live="polite" className="mt-3 min-h-5 text-center text-sm text-red-400">
                {status === "error" ? error : ""}
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}