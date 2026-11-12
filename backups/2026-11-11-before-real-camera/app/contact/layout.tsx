// app/contact/layout.tsx  (only here to give the contact page its title and description for Google.
// The page itself is app/contact/page.tsx; it can't hold these because it runs in the browser.)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "contact",
  description: "Get in touch with Ethan Wang about photography, projects or anything else.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact", title: "contact | wingwang" },
};

export default function ContactLayout({ children }: LayoutProps<"/contact">) {
  return children;
}
