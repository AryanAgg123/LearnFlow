import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

const protectedRoutes = ["/dashboard", "/profile", "/context", "/roadmap", "/practice-tests"];
const guestOnlyRoutes = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isGuestOnly = guestOnlyRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected && !isGuestOnly) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isGuestOnly && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/context/:path*",
    "/roadmap/:path*",
    "/practice-tests/:path*",
    "/login",
    "/signup",
  ],
};
