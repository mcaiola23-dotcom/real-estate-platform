import { NextRequest, NextResponse } from "next/server";

const DEBUG_ROUTES = new Set(["/test-map", "/test-leaflet"]);

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  if (DEBUG_ROUTES.has(request.nextUrl.pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/test-map", "/test-leaflet"],
};
