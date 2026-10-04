import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json([], {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
