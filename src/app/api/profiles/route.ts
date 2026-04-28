import { NextRequest, NextResponse } from "next/server";
import { authFetch, setTokenCookies } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const path = `/api/profiles/${qs ? `?${qs}` : ""}`;

  const result = await authFetch(path);
  if (!result) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { response, refreshed } = result;
  const data = await response.json();
  const res = NextResponse.json(data, { status: response.status });
  if (refreshed) setTokenCookies(res, refreshed);
  return res;
}
