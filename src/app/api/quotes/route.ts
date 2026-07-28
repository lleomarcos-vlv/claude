import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, guard, handleError, ok, readJson } from "@/lib/api";
import { quoteSchema } from "@/lib/validation";
import { nextProtocol } from "@/lib/protocol";
import { quickEstimateCents } from "@/lib/pricing";
import { serviceBySlug } from "@/content/services";
import { onQuoteCreated } from "@/lib/notifications";
import { looksLikeSpamContent } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);

    const blocked = await guard(request, "quotes", body, { limit: 6, windowMs: 15 * 60_000, captcha: true });
    if (blocked) return blocked;

    const input = quoteSchema.parse(body);

    if (input.notes && looksLikeSpamContent(input.notes)) {
      return fail("Não conseguimos processar as observações. Reescreva sem links, por favor.", 400, {
        notes: "Remova os links do texto.",
      });
    }

    const service = serviceBySlug(input.serviceSlug);
    if (!service) return fail("Serviço não encontrado.", 404, { serviceSlug: "Escolha um serviço válido." });

    const user = await getCurrentUser();
    const protocol = await nextProtocol("quote");

    const quote = await prisma.quote.create({
      data: {
        protocol,
        userId: user?.id ?? null,
        name: input.name,
        phone: input.phone,
        whatsapp: input.whatsapp || input.phone,
        email: input.email,
        city: input.city,
        address: input.address,
        propertyType: input.propertyType,
        areaM2: input.areaM2 ?? null,
        serviceSlug: service.slug,
        serviceName: service.name,
        frequency: input.frequency,
        notes: input.notes || null,
        photos: JSON.stringify(input.photos ?? []),
        estimatedPrice: quickEstimateCents(input.serviceSlug, input.areaM2),
        utmSource: input.utmSource || null,
        utmCampaign: input.utmCampaign || null,
      },
      select: {
        id: true,
        protocol: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        serviceName: true,
        city: true,
        areaM2: true,
        estimatedPrice: true,
        userId: true,
      },
    });

    await onQuoteCreated(quote);

    return ok(
      {
        quote: { protocol: quote.protocol, serviceName: quote.serviceName, estimatedPrice: quote.estimatedPrice },
        message: `Pedido recebido! Seu protocolo é ${quote.protocol}. Respondemos em até 2 horas úteis.`,
      },
      201,
    );
  } catch (error) {
    return handleError(error, "quotes:post");
  }
}
