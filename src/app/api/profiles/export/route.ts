import { NextRequest, NextResponse } from "next/server";
import { authFetch, setTokenCookies } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (!searchParams.has("format")) searchParams.set("format", "csv");
  const path = `/api/profiles/export/?${searchParams.toString()}`;

  const result = await authFetch(path);
  if (!result) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { response, refreshed } = result;
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  }

  const csv = await response.arrayBuffer();
  const disposition = response.headers.get("content-disposition") || 'attachment; filename="profiles.csv"';
  const res = new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": disposition,
    },
  });
  if (refreshed) setTokenCookies(res, refreshed);
  return res;
}
