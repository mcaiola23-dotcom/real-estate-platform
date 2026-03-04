import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makeRateLimitKey, enforceNamedRateLimit } from "@/lib/server/rate-limit";
import { joinPortalApiPath } from "@/lib/server/portal-api";
import { normalizeFavoritesPayload, resolveEndpointPolicy } from "../proxy-utils";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function withRateLimitHeaders(response: NextResponse, args: {
  limit: number;
  remaining: number;
  resetAt: number;
}): NextResponse {
  response.headers.set("x-ratelimit-limit", String(args.limit));
  response.headers.set("x-ratelimit-remaining", String(args.remaining));
  response.headers.set("x-ratelimit-reset", String(Math.floor(args.resetAt / 1000)));
  return response;
}

function copyRequestHeaders(headers: Headers): Headers {
  const copied = new Headers();
  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === "host" ||
      lowerKey === "connection" ||
      lowerKey === "content-length"
    ) {
      return;
    }
    copied.set(key, value);
  });
  return copied;
}

async function forwardToPortalApi(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  const joinedPath = path.join("/");
  const policy = resolveEndpointPolicy(joinedPath, request.method);

  const session = await auth();
  const sessionAccessToken = (session as { accessToken?: string } | null)?.accessToken ?? null;
  const incomingAuthHeader = request.headers.get("authorization");
  const hasAuthorization = Boolean(incomingAuthHeader || sessionAccessToken);

  if (policy?.requireAuth && !hasAuthorization) {
    return NextResponse.json(
      { detail: "Authentication required for this endpoint." },
      { status: 401 }
    );
  }

  let rateLimitDecision: ReturnType<typeof enforceNamedRateLimit> | null = null;

  if (policy) {
    const identity = session?.user?.email ?? session?.user?.id ?? incomingAuthHeader ?? null;
    const rateLimitKey = makeRateLimitKey({
      scope: `portal-proxy:${joinedPath}`,
      method: request.method,
      headers: request.headers,
      identity,
    });
    const decision = enforceNamedRateLimit({
      policyName: policy.rateLimitPolicyName,
      key: rateLimitKey,
    });
    rateLimitDecision = decision;
    if (!decision.allowed) {
      return withRateLimitHeaders(
        NextResponse.json(
          { detail: "Too many requests. Please retry shortly." },
          { status: 429 }
        ),
        decision
      );
    }
  }

  const outgoingHeaders = copyRequestHeaders(request.headers);
  if (!outgoingHeaders.get("authorization") && sessionAccessToken) {
    outgoingHeaders.set("authorization", `Bearer ${sessionAccessToken}`);
  }

  const targetUrl = joinPortalApiPath(
    `/${joinedPath}${request.nextUrl.search || ""}`
  );
  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text();

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      method,
      headers: outgoingHeaders,
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "Unable to reach portal API backend." },
      { status: 502 }
    );
  }

  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const shouldNormalizeFavorites =
    isJson && joinedPath.startsWith("api/favorites") && method === "GET";

  let proxiedResponse: NextResponse;
  if (shouldNormalizeFavorites) {
    const data = await upstreamResponse.json();
    proxiedResponse = NextResponse.json(normalizeFavoritesPayload(data), {
      status: upstreamResponse.status,
    });
  } else if (isJson) {
    const data = await upstreamResponse.json();
    proxiedResponse = NextResponse.json(data, { status: upstreamResponse.status });
  } else {
    const raw = await upstreamResponse.arrayBuffer();
    proxiedResponse = new NextResponse(raw, { status: upstreamResponse.status });
  }

  if (rateLimitDecision) {
    withRateLimitHeaders(proxiedResponse, rateLimitDecision);
  }

  const upstreamContentType = upstreamResponse.headers.get("content-type");
  if (upstreamContentType) {
    proxiedResponse.headers.set("content-type", upstreamContentType);
  }

  return proxiedResponse;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forwardToPortalApi(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forwardToPortalApi(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return forwardToPortalApi(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forwardToPortalApi(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return forwardToPortalApi(request, context);
}
