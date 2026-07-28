import { handleError, ok, readJson } from "@/lib/api";
import { estimateSchema } from "@/lib/validation";
import { estimate } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/security";
import { fail } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Estimativa do simulador.
 *
 * O simulador do site calcula no cliente (resultado instantâneo) usando as mesmas
 * funções de `@/lib/pricing`. Este endpoint existe para integrações externas —
 * anúncios, landing pages e o chat de atendimento.
 */
export async function POST(request: Request) {
  try {
    const limited = rateLimit(`estimate:${clientIp(request)}`, 40, 60_000);
    if (!limited.ok) return fail("Muitas consultas. Aguarde um instante.", 429);

    const input = estimateSchema.parse(await readJson(request));
    const result = estimate(input);
    if (!result) return fail("Serviço não encontrado.", 404);

    return ok({
      estimate: {
        service: { slug: result.service.slug, name: result.service.name },
        areaM2: result.areaM2,
        frequency: result.frequency,
        visitsPerMonth: result.visitsPerMonth,
        perVisit: result.perVisit,
        monthly: result.monthly,
        quoteOnly: result.quoteOnly,
        minVisitApplied: result.minVisitApplied,
        aboveTable: result.aboveTable,
        recommended: result.recommended
          ? {
              plan: result.recommended.plan.slug,
              name: result.recommended.plan.name,
              price: result.recommended.price,
              savings: result.recommended.savings,
              reason: result.recommended.reason,
            }
          : null,
      },
    });
  } catch (error) {
    return handleError(error, "estimate");
  }
}
