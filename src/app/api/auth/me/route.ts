import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(
      { ok: true, user },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return handleError(error, "auth/me");
  }
}
