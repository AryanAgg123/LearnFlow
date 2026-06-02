import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { saveGoogleTokensForUser, validateGoogleState } from "@/lib/google/calendar";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const validState = await validateGoogleState(state);

  if (!code || !validState) {
    return NextResponse.redirect(new URL("/roadmap?calendar=error", request.url));
  }

  try {
    await saveGoogleTokensForUser(session.userId, code);
    return NextResponse.redirect(new URL("/roadmap?calendar=connected", request.url));
  } catch {
    return NextResponse.redirect(new URL("/roadmap?calendar=error", request.url));
  }
}
