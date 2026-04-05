import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("token-tracker-session");

  const publicPaths = ["/login", "/register"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isStaticOrAsset =
    pathname.startsWith("/_next") || pathname.includes(".");

  if (!sessionCookie && !isPublic && !isAuthApi && !isStaticOrAsset) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
