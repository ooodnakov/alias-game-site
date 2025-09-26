import type { Metadata } from "next";

import { getBaseUrl } from "./url";

type UrlInput = string | URL;

type AlternateLinkDescriptor = {
  title?: string;
  url: UrlInput;
};

type LinkInput = UrlInput | AlternateLinkDescriptor;

type NullableLinkInput = LinkInput | null | undefined;

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

function localizeUrl<T extends UrlInput>(value: T, locale: string): T {
  if (value instanceof URL) {
    const url = new URL(value.toString());
    url.pathname = addLocaleToPathname(url.pathname, locale);
    return url as T;
  }

  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      const url = new URL(value);
      url.pathname = addLocaleToPathname(url.pathname, locale);
      return url.toString() as T;
    }

    if (value.startsWith("/")) {
      // Use the configured site URL so relative paths resolve consistently across environments.
      const url = new URL(value, `${getBaseUrl()}/`);
      url.pathname = addLocaleToPathname(url.pathname, locale);
      const localized = `${url.pathname}${url.search}${url.hash}`;
      return localized as T;
    }

    return value;
  }

  return value;
}

function isAlternateLinkDescriptor(value: LinkInput): value is AlternateLinkDescriptor {
  return typeof value === "object" && value !== null && "url" in value;
}

function localizeLink<T extends LinkInput>(value: T, locale: string): T {
  if (isAlternateLinkDescriptor(value)) {
    return {
      ...value,
      url: localizeUrl(value.url, locale),
    } satisfies AlternateLinkDescriptor as T;
  }

  return localizeUrl(value, locale) as T;
}

function localizeNullableLink<T extends NullableLinkInput>(value: T, locale: string): T {
  if (value == null) {
    return value;
  }

  return localizeLink(value, locale);
}

export function localizeMetadata(metadata: Metadata, locale: string): Metadata {
  const localized: Metadata = { ...metadata };

  if (metadata.alternates?.canonical != null) {
    localized.alternates = {
      ...metadata.alternates,
      canonical: localizeNullableLink(metadata.alternates.canonical, locale),
    };
  }

  if (metadata.openGraph?.url != null) {
    localized.openGraph = {
      ...metadata.openGraph,
      url:
        (localizeNullableLink(metadata.openGraph.url, locale) as string | URL | null) ??
        undefined,
    };
  }

  return localized;
}
