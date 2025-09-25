export const runtime = "nodejs";

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMessages } from "@/i18n/get-messages";
import { getSafeLocale } from "@/i18n/get-safe-locale";
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

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getSafeLocale();

  setRequestLocale(locale);
  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-surface text-foreground antialiased font-sans">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
