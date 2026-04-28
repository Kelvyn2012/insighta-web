import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";

export async function GET() {
  const resp = await fetch(`${BACKEND_URL}/auth/github/`);
  if (!resp.ok) {
    return NextResponse.json({ error: "Failed to initiate auth" }, { status: 502 });
  }
  const data = await resp.json();
  // Rewrite redirect_uri to point at this portal's callback
  const authUrl = new URL(data.redirect_url);
  const portalCallback =
    process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
      : "http://localhost:3000/api/auth/callback";
  authUrl.searchParams.set("redirect_uri", portalCallback);

  // Store state in a short-lived cookie for validation
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("oauth_state", data.state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
