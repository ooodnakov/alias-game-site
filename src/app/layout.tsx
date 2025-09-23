import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alias.cards";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Alias – decks and download",
    template: "%s | Alias",
  },
  description:
    "Discover Alias party game decks, upload your own, and download the privacy-first Android app.",
  openGraph: {
    title: "Alias – decks and download",
    description:
      "Discover Alias party game decks, upload your own, and download the privacy-first Android app.",
    url: siteUrl,
    siteName: "Alias",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alias – decks and download",
    description:
      "Discover Alias party game decks, upload your own, and download the privacy-first Android app.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
