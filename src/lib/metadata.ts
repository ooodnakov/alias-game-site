import type { Metadata } from "next";

type UrlInput = string | URL;

type NullableUrl = UrlInput | null | undefined;

function addLocaleToPathname(pathname: string, locale: string): string {
  if (!locale) {
    return pathname;
  }

  if (!pathname || pathname === "/") {
    return `/${locale}`;
  }

  if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
    return pathname;
  }

  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function localizeUrlValue<T extends UrlInput>(value: T, locale: string): T {
  if (value instanceof URL) {
    const url = new URL(value.toString());
    url.pathname = addLocaleToPathname(url.pathname, locale);
    return url as T;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const url = new URL(value);
    url.pathname = addLocaleToPathname(url.pathname, locale);
    return url.toString() as T;
  }

  if (value.startsWith("/")) {
    const url = new URL(value, "https://example.com");
    url.pathname = addLocaleToPathname(url.pathname, locale);
    const localized = `${url.pathname}${url.search}${url.hash}`;
    return localized as T;
  }

  return value;
}

function localizeNullableUrl(value: NullableUrl, locale: string): NullableUrl {
  if (value == null) {
    return value;
  }

  return localizeUrlValue(value, locale);
}

export function localizeMetadata(metadata: Metadata, locale: string): Metadata {
  const localized: Metadata = { ...metadata };

  if (metadata.alternates?.canonical != null) {
    localized.alternates = {
      ...metadata.alternates,
      canonical: localizeNullableUrl(metadata.alternates.canonical, locale),
    };
  }

  if (metadata.openGraph?.url != null) {
    localized.openGraph = {
      ...metadata.openGraph,
      url: localizeNullableUrl(metadata.openGraph.url, locale) ?? undefined,
    };
  }

  return localized;
}
