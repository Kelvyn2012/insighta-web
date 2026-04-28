import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, setTokenCookies } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_params", request.url));
  }

  const storedState = request.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/?error=state_mismatch", request.url));
  }

  // Pass our portal callback URL so the backend uses it in the GitHub code exchange
  const portalCallback =
    process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
      : "http://localhost:3000/api/auth/callback";

  const backendUrl =
    `${BACKEND_URL}/auth/github/callback/?code=${code}&state=${state}` +
    `&redirect_uri=${encodeURIComponent(portalCallback)}`;

  const resp = await fetch(backendUrl);

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    const msg = body.message || "auth_failed";
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(msg)}`, request.url));
  }

  const data = await resp.json();
  const response = NextResponse.redirect(new URL("/profiles", request.url));
  setTokenCookies(response, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 170),
  });
  response.cookies.delete("oauth_state");
  return response;
}
