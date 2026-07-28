import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Emite um desafio de captcha assinado (sem estado no servidor). */
export function GET() {
  return NextResponse.json(createCaptcha(), {
    headers: { "cache-control": "no-store, max-age=0" },
  });
}
