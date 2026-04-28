import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, clearTokenCookies, validateOrigin } from "@/lib/backend";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const jar = await cookies();
  const refreshToken = jar.get("refresh_token")?.value;

  if (refreshToken) {
    await fetch(`${BACKEND_URL}/auth/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {});
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  clearTokenCookies(response);
  return response;
}
