export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return siteUrl.replace(/\/$/, "");
}

export function buildDeckJsonUrl(slug: string) {
  return `${getBaseUrl()}/decks/${slug}.json`;
}

export function buildDeckImportUrl(slug: string) {
  const jsonUrl = buildDeckJsonUrl(slug);
  return `alias://import?deck=${encodeURIComponent(jsonUrl)}`;
}
