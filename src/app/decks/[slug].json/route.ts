import { NextResponse } from "next/server";

import { getDeckMetadataBySlug } from "@/lib/deck-store";

interface Params {
  params: { slug: string };
}

export async function GET(_request: Request, { params }: Params) {
  const metadata = await getDeckMetadataBySlug(params.slug);

  if (!metadata) {
    return NextResponse.json({ message: "Deck not found" }, { status: 404 });
  }

  try {
    const upstream = await fetch(metadata.jsonPath, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!upstream.ok || !upstream.body) {
      const status = upstream.status === 404 ? 404 : 502;
      return NextResponse.json({ message: "Deck file unavailable" }, { status });
    }

    const headers = new Headers({
      "Cache-Control": "public, max-age=300, s-maxage=600",
    });
    const contentType = upstream.headers.get("Content-Type") ?? "application/json";
    headers.set("Content-Type", contentType);
    const contentLength = upstream.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    const etag = upstream.headers.get("ETag");
    if (etag) {
      headers.set("ETag", etag);
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error(`Failed to stream deck JSON for slug "${params.slug}":`, error);
    return NextResponse.json({ message: "Deck file unavailable" }, { status: 502 });
  }
}
