import { NextResponse } from "next/server";

import {
  isSanityCacheTag,
  revalidateSanityTags,
  SANITY_CACHE_TAGS,
  type SanityCacheTag,
} from "../../../lib/sanity.cache";

const REVALIDATE_TOKEN_HEADER = "x-sanity-revalidate-token";

interface RevalidateRequestBody {
  tags?: unknown;
}

function parseRequestedTags(value: unknown): SanityCacheTag[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((tag): tag is string => typeof tag === "string")
    .filter((tag): tag is SanityCacheTag => isSanityCacheTag(tag));
}

export async function POST(request: Request) {
  const expectedToken = process.env.SANITY_REVALIDATE_TOKEN; // secret-scan:allow
  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Sanity revalidate token is not configured." },
      { status: 503 }
    );
  }

  const providedToken = request.headers.get(REVALIDATE_TOKEN_HEADER);
  if (!providedToken || providedToken !== expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as RevalidateRequestBody;
  const requestedTags = parseRequestedTags(body.tags);
  const tagsToRevalidate =
    requestedTags.length > 0
      ? requestedTags
      : (Object.values(SANITY_CACHE_TAGS) as SanityCacheTag[]);

  revalidateSanityTags(tagsToRevalidate);

  return NextResponse.json({
    ok: true,
    revalidated: tagsToRevalidate,
  });
}
