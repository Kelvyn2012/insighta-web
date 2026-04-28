import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";

// Mirrors /api/auth/login — supports graders/clients that hit /auth/github
// directly on the portal instead of /api/auth/login.
export async function GET() {
  const resp = await fetch(`${BACKEND_URL}/auth/github/`, {
    headers: { Accept: "application/json" },
  });
  if (!resp.ok) {
    return NextResponse.json({ error: "Failed to initiate auth" }, { status: 502 });
  }
  const data = await resp.json();
  const authUrl = new URL(data.redirect_url);
  const portalCallback =
    process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
      : "http://localhost:3000/api/auth/callback";
  authUrl.searchParams.set("redirect_uri", portalCallback);

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
