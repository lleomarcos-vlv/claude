import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { clientIp, looksLikeSpamContent, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

const schema = z.object({
  protocol: z.string().min(3).max(40),
  rating: z.coerce.number().int().min(1).max(5),
  npsScore: z.coerce.number().int().min(0).max(10).nullable().optional(),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
  publish: z.boolean().optional().default(false),
});

/** Resposta da pesquisa de satisfação enviada após o serviço. */
export async function POST(request: Request) {
  try {
    const limited = rateLimit(`survey:${clientIp(request)}`, 10, 10 * 60_000);
    if (!limited.ok) return fail("Muitas tentativas. Aguarde um instante.", 429);

    const input = schema.parse(await readJson(request));

    const booking = await prisma.booking.findUnique({
      where: { protocol: input.protocol },
      select: { id: true, userId: true },
    });
    if (!booking) return fail("Serviço não encontrado.", 404);

    // Comentário com spam não é publicado, mas a nota é registrada.
    const comment = input.comment?.trim() || null;
    const publish = input.publish && input.rating >= 4 && !(comment && looksLikeSpamContent(comment));

    await prisma.satisfactionSurvey.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        userId: booking.userId,
        rating: input.rating,
        npsScore: input.npsScore ?? null,
        comment,
        publish,
        answeredAt: new Date(),
      },
      update: {
        rating: input.rating,
        npsScore: input.npsScore ?? null,
        comment,
        publish,
        answeredAt: new Date(),
      },
    });

    return ok({ message: "Avaliação registrada. Obrigado!" }, 201);
  } catch (error) {
    return handleError(error, "survey");
  }
}
