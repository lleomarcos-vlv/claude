import { NextResponse } from "next/server";
import { getAvailability, suggestedStartDate } from "@/lib/availability";
import { handleError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Disponibilidade real da agenda para o calendário de agendamento. */
export async function GET(request: Request) {
  try {
    const limited = rateLimit(`availability:${clientIp(request)}`, 60, 60_000);
    if (!limited.ok) return NextResponse.json({ ok: false, error: "Muitas consultas." }, { status: 429 });

    const url = new URL(request.url);
    const from = url.searchParams.get("de") ?? suggestedStartDate();
    const days = Math.min(63, Math.max(7, Number(url.searchParams.get("dias") ?? 42)));

    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      return NextResponse.json({ ok: false, error: "Data inicial inválida." }, { status: 400 });
    }

    const days_ = await getAvailability(from, days);
    return NextResponse.json(
      { ok: true, from, days: days_ },
      { headers: { "cache-control": "private, max-age=60" } },
    );
  } catch (error) {
    return handleError(error, "availability");
  }
}
