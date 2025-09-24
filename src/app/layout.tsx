import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";

import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { getMessages as getMessagesUtil } from "@/i18n/get-messages";
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

function isAppLocale(locale: string | null | undefined): locale is AppLocale {
  return locale != null && locales.some((candidate) => candidate === locale);
}

export default async function RootLayout({ children }: RootLayoutProps) {
  let locale: AppLocale = defaultLocale;

  try {
    const detectedLocale = await getLocale();
    if (isAppLocale(detectedLocale)) {
      locale = detectedLocale;
    }
  } catch {
    // During build, getLocale() can throw. Fallback to defaultLocale is intended.
  }

  setRequestLocale(locale);

  const messages = await getMessagesUtil(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-surface text-foreground antialiased font-sans">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
