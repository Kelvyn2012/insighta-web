/**
 * Server-side helper for talking to the Insighta backend.
 * Reads tokens from HTTP-only cookies and handles auto-refresh.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const BACKEND_URL =
  process.env.INSIGHTA_API_URL || "https://insighta-backend.onrender.com";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix timestamp
}

// ── Cookie helpers ─────────────────────────────────────────────────────────

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export function setTokenCookies(res: NextResponse, tokens: TokenPair): void {
  res.cookies.set("access_token", tokens.access_token, {
    ...COOKIE_OPTS,
    maxAge: 180,
  });
  res.cookies.set("refresh_token", tokens.refresh_token, {
    ...COOKIE_OPTS,
    maxAge: 300,
  });
  res.cookies.set("expires_at", String(tokens.expires_at), {
    ...COOKIE_OPTS,
    maxAge: 300,
  });
}

export function clearTokenCookies(res: NextResponse): void {
  res.cookies.delete("access_token");
  res.cookies.delete("refresh_token");
  res.cookies.delete("expires_at");
}

// ── Token refresh ──────────────────────────────────────────────────────────

async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  const resp = await fetch(`${BACKEND_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + 170,
  };
}

// ── Authenticated fetch ────────────────────────────────────────────────────

export interface AuthFetchResult {
  response: Response;
  refreshed?: TokenPair;
}

/**
 * Fetch with Bearer token from cookies; auto-refreshes if token is near expiry.
 * Returns the raw fetch Response and any new tokens that should be set.
 */
export async function authFetch(
  path: string,
  init: RequestInit = {}
): Promise<AuthFetchResult | null> {
  const jar = await cookies();
  let accessToken = jar.get("access_token")?.value;
  let refreshToken = jar.get("refresh_token")?.value;
  const expiresAt = Number(jar.get("expires_at")?.value || "0");

  if (!accessToken && !refreshToken) return null;

  let refreshed: TokenPair | undefined;

  if (!accessToken || Date.now() / 1000 >= expiresAt - 10) {
    if (!refreshToken) return null;
    const newTokens = await refreshTokens(refreshToken);
    if (!newTokens) return null;
    accessToken = newTokens.access_token;
    refreshed = newTokens;
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string>),
      Authorization: `Bearer ${accessToken}`,
      "X-API-Version": "1",
    },
  });

  return { response, refreshed };
}

// ── CSRF validation ────────────────────────────────────────────────────────

/**
 * Validate that state-mutating requests come from our own origin.
 * Used in API route handlers for POST/DELETE.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}
