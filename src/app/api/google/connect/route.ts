import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { createGoogleAuthUrl } from "@/lib/google/calendar";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000"));
  }

  const url = await createGoogleAuthUrl();
  return NextResponse.redirect(url);
}
