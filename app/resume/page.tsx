"use client";
// app/resume/page.tsx  (everything for the resume page lives in this one file)
// To update your resume, edit the lists below. Anything in [BRACKETS] is a placeholder for you to replace.
// "download pdf" opens the print window with a clean white version (choose "Save as PDF").
// "copy text" copies the whole resume as plain text, ready to paste into an application form or a doc.

import { useState } from "react";
import Link from "next/link";

// ---- The top ----
const NAME = "ethan wang";
const HEADLINE = "student, photographer";
// the lines on the right. `href` is optional: where clicking it goes
const CONTACT: { text: string; href?: string }[] = [
  { text: "ethan@wingwang.ca", href: "" },
  { text: "wingwang.ca", href: "https://wingwang.ca" },
  { text: "TORONTO, ONTARIO" },
  { text: "linkedin.com/in/ethan-wang-9206563a1", href: "https://www.linkedin.com/in/ethan-wang-9206563a1/" },
];

// ---- Left column ----
const EDUCATION: { school: string; dates: string; details: string; courses: string }[] = [
  {
    school: "[SCHOOL NAME]",
    dates: "[2023] to 2027",
    details: "[PROGRAM / STREAM, e.g. IB, AP] · [AVERAGE OR GPA, optional]",
    courses: "relevant courses: [COURSE], [COURSE], [COURSE]",
  },
];

// one block per job, newest first. `points` = the bullet points
const EXPERIENCE: { role: string; dates: string; where: string; points: string[] }[] = [
  {
    role: "Coop Student",
    dates: "september 2025 to january 2026",
    where: "Scarbrough Health Network · Toronto",
    points: ["Welcomed patient families, providing directions to proper rooms or clinics. Assisted nurses and staff with keeping PPE in stock, aiding in discharges and delivering medicine to nurses."],
  },
  {
    role: "FREELANCE PHOTOGRAPHER",
    dates: "2026 to present",
    where: "[CLIENTS / EVENTS]",
    points: ["[e.g. shot N events for school clubs and teams]", "[e.g. delivered edited sets within 48 hours]"],
  },
];

const PROJECTS: { name: string; year: string; text: string }[] = [
  {
    name: "wingwang.ca",
    year: "2026",
    text: "designed and built my portfolio from scratch in next.js 16 and react 19: an interactive canvas intro, a scroll-driven camera lens, folder-based photo albums and a working contact form.",
  },
  { name: "aeon salmon v1", year: "nov, 2026", text: "a small desk buddy with a face, built around a raspberry pi pico 2 w. version 1 sits on the desk: a wi-fi clock, alarm and timer with moods." },
];

const ACTIVITIES: { name: string; detail: string; years: string }[] = [
  { name: "oasis leader", detail: "led the youngins", years: "2026" },
  { name: "HOSA PR", detail: "create meet the execs, manage media for mwhosa", years: "2nd year" },
  { name: "a", detail: "[WHERE, HOURS]", years: "[YEARS]" },
];

// ---- Right column: little tags ----
const SKILLS = ["photography", "photo editing", "Intermediate (Standard) CPR First Aid Certified"];
const TOOLS = ["next.js", "react", "typescript", "tailwind", "LIGHTROOM C"];
const AWARDS = ["HONOUR ROLL, 23-24"];
const LANGUAGES = ["english", "hakka chinese"];

// ---- The bottom line ----
const FOOTNOTE = "last updated [NOV 2026] · references available on request";

// ---- colours (same as the rest of the site) ----
const PAGE_BG = "255,255,255"; // the page's background (white)
const AMBER = "178,104,14"; // the section headings (a deeper amber, so they read on white)
const BLUE = "100,159,255";  // the download button's outline

// the whole resume as plain text, for the "copy text" button
function resumeText(): string {
  const out: string[] = [];
  out.push(NAME.toUpperCase(), HEADLINE, CONTACT.map((c) => c.text).join(" · "), "");
  out.push("EDUCATION");
  EDUCATION.forEach((e) => out.push(`${e.school} (${e.dates})`, e.details, e.courses));
  out.push("", "EXPERIENCE");
  EXPERIENCE.forEach((x) => { out.push(`${x.role} (${x.dates})`, x.where, ...x.points.map((p) => `- ${p}`), ""); });
  out.push("PROJECTS");
  PROJECTS.forEach((p) => out.push(`${p.name} (${p.year})`, p.text, ""));
  out.push("LEADERSHIP + ACTIVITIES");
  ACTIVITIES.forEach((a) => out.push(`${a.name}: ${a.detail} (${a.years})`));
  out.push("", `SKILLS: ${SKILLS.join(", ")}`, `TOOLS: ${TOOLS.join(", ")}`, `AWARDS: ${AWARDS.join(", ")}`, `LANGUAGES: ${LANGUAGES.join(", ")}`, "", FOOTNOTE);
  return out.join("\n");
}

const CSS = `
html, body { background-color: rgb(${PAGE_BG}) !important; }

/* the printed / PDF version: white paper, black text, one letter page, no navbar or buttons */
@media print {
  @page { size: letter; margin: 0; }
  html, body { background: #fff !important; color: #000 !important; }
  body > header, .no-print, nextjs-portal { display: none !important; }
  .rs-page { padding: 0.5in 0.55in !important; background: #fff !important; min-height: 0 !important; }
  .rs-card { border: 0 !important; background: #fff !important; padding: 0 !important; border-radius: 0 !important; }
  .rs-card * { color: #000 !important; border-color: #ccc !important; box-shadow: none !important; }
  .rs-muted { color: #444 !important; }
  .rs-tag { background: #fff !important; border: 1px solid #bbb !important; }
  .rs-card a { text-decoration: none !important; }
  /* everything shrinks together (sizes are in rem), and the two columns stay side by side, so it fits one page */
  html { font-size: 10.5px !important; }
  .rs-page > div { padding: 0 !important; max-width: none !important; }
  .rs-top { flex-direction: row !important; justify-content: space-between !important; align-items: flex-start !important; }
  .rs-top ul { text-align: right !important; }
  .rs-grid { grid-template-columns: 1fr 13rem !important; }
}
`;

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.18em]" style={{ color: `rgb(${AMBER})` }}>
      {children}
    </h2>
  );
}

function Tags({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mb-9 break-inside-avoid">
      <SectionTitle>{title}</SectionTitle>
      <ul className="flex flex-wrap gap-2">
        {items.map((t, i) => (
          <li key={i} className="rs-tag rounded-md bg-black/[0.06] px-2.5 py-1 text-sm text-neutral-800">{t}</li>
        ))}
      </ul>
    </section>
  );
}

export default function ResumePage() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resumeText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // some browsers block the clipboard; then the button just stays as it is
    }
  };
  const btn = "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

  return (
    <main className="rs-page min-h-[calc(100dvh-4rem)] text-neutral-900" style={{ background: `rgb(${PAGE_BG})` }}>
      <style>{CSS}</style>
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
        {/* the bar above the resume (hidden when printed) */}
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="font-mono text-xs text-neutral-600 transition hover:text-black">&larr; home</Link>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className={`${btn} text-neutral-900 hover:bg-black/5`} style={{ borderColor: `rgb(${BLUE})`, background: `rgba(${BLUE},.08)` }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
              download pdf
            </button>
            <button type="button" onClick={copy} className={`${btn} border-black/15 text-neutral-900 hover:bg-black/5`} aria-live="polite">
              {copied ? "copied" : "copy text"}
            </button>
            <Link href="/contact" className={`${btn} border-black/15 text-neutral-900 hover:bg-black/5`}>contact me</Link>
          </div>
        </div>

        {/* the resume */}
        <article className="rs-card rounded-2xl border border-black/10 bg-black/[0.02] px-6 py-10 sm:px-12 sm:py-14">
          {/* name, headline and contact */}
          <div className="rs-top flex flex-col gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">{NAME}</h1>
              <p className="rs-muted mt-3 text-neutral-600 sm:text-lg">{HEADLINE}</p>
            </div>
            <ul className="space-y-1 font-mono text-xs text-neutral-700 sm:text-right">
              {CONTACT.map((c, i) => (
                <li key={i}>
                  {c.href ? <a href={c.href} target="_blank" rel="noopener noreferrer" className="hover:underline">{c.text}</a> : c.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="rs-grid mt-9 grid gap-x-14 md:grid-cols-[1fr_13rem]">
            {/* left column */}
            <div>
              <section className="mb-10">
                <SectionTitle>education</SectionTitle>
                {EDUCATION.map((e, i) => (
                  <div key={i} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-lg font-medium">{e.school}</h3>
                      <span className="rs-muted shrink-0 font-mono text-xs text-neutral-500">{e.dates}</span>
                    </div>
                    <p className="rs-muted mt-1 text-sm text-neutral-600">{e.details}</p>
                    <p className="mt-1 text-sm text-neutral-800">{e.courses}</p>
                  </div>
                ))}
              </section>

              <section className="mb-10">
                <SectionTitle>experience</SectionTitle>
                <div className="divide-y divide-black/10 border-t border-black/10">
                  {EXPERIENCE.map((x, i) => (
                    <div key={i} className="break-inside-avoid py-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="text-lg font-medium">{x.role}</h3>
                        <span className="rs-muted shrink-0 font-mono text-xs text-neutral-500">{x.dates}</span>
                      </div>
                      <p className="rs-muted mt-1 text-sm text-neutral-600">{x.where}</p>
                      <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-neutral-800 marker:text-neutral-500">
                        {x.points.map((pt, j) => <li key={j}>{pt}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-10">
                <SectionTitle>projects</SectionTitle>
                <div className="divide-y divide-black/10 border-t border-black/10">
                  {PROJECTS.map((p, i) => (
                    <div key={i} className="break-inside-avoid py-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="text-lg font-medium">{p.name}</h3>
                        <span className="rs-muted shrink-0 font-mono text-xs text-neutral-500">{p.year}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-800">{p.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-4">
                <SectionTitle>leadership + activities</SectionTitle>
                <ul className="divide-y divide-black/10 border-t border-black/10">
                  {ACTIVITIES.map((a, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-4 py-3.5">
                      <span>
                        <span className="font-medium">{a.name}</span>
                        <span className="rs-muted text-neutral-600"> · {a.detail}</span>
                      </span>
                      <span className="rs-muted shrink-0 font-mono text-xs text-neutral-500">{a.years}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* right column */}
            <aside className="mt-8 md:mt-0">
              <Tags title="skills" items={SKILLS} />
              <Tags title="tools" items={TOOLS} />
              <Tags title="awards" items={AWARDS} />
              <Tags title="languages" items={LANGUAGES} />
            </aside>
          </div>

          <p className="rs-muted mt-8 border-t border-black/10 pt-6 font-mono text-xs text-neutral-500">{FOOTNOTE}</p>
        </article>

        <p className="no-print mt-6 max-w-2xl text-sm leading-relaxed text-neutral-500">
          &ldquo;download pdf&rdquo; opens the print window with a clean white version: choose &ldquo;Save as PDF&rdquo;.
          &ldquo;copy text&rdquo; copies the whole resume as plain text.
        </p>
      </div>
    </main>
  );
}
