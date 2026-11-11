// app/resume/layout.tsx  (only here to give the resume page its title for the browser tab.
// The page itself is app/resume/page.tsx; it can't hold this because it runs in the browser.)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "resume",
  description: "Ethan Wang's resume.",
  alternates: { canonical: "/resume" },
  // kept out of Google: people can open it from a link, but it won't show up in search results
  robots: { index: false, follow: true },
};

export default function ResumeLayout({ children }: LayoutProps<"/resume">) {
  return children;
}
