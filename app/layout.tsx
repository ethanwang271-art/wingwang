import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ---- SEO: how the site shows up in Google and in link previews. Edit these ----
const SITE_URL = "https://wingwang.ca";
const SITE_NAME = "wingwang";
const SITE_TITLE = "wingwang | Ethan Wang";
const SITE_DESCRIPTION =
  "Ethan Wang's photography: albums from Norway, San Francisco and more, plus a bit about me.";
const SHARE_IMAGE = "/ethan.jpg"; // the picture shown when someone shares a link to the site
const SOCIAL_LINKS = [
  "https://instagram.com/etnwingwang",
  "https://www.linkedin.com/in/ethan-wang-9206563a1/",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // each page sets its own title, like "photos", and this turns it into "photos | wingwang"
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Ethan Wang", url: SITE_URL }],
  creator: "Ethan Wang",
  keywords: ["Ethan Wang", "wingwang", "photography", "photographer", "photos", "portfolio"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_CA",
    images: [{ url: SHARE_IMAGE, alt: "Ethan Wang" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0d0f", // the colour of the browser bar on phones
  colorScheme: "dark",
};

// tells Google who the site belongs to (a "Person"), with links to your profiles
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ethan Wang",
  alternateName: SITE_NAME,
  url: SITE_URL,
  image: `${SITE_URL}${SHARE_IMAGE}`,
  sameAs: SOCIAL_LINKS,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
        />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
