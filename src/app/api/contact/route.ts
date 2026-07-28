import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, guard, handleError, ok, readJson } from "@/lib/api";
import { contactSchema } from "@/lib/validation";
import { looksLikeSpamContent } from "@/lib/security";
import { dispatch } from "@/lib/notifications";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);

    const blocked = await guard(request, "contact", body, { limit: 5, windowMs: 15 * 60_000, captcha: true });
    if (blocked) return blocked;

    const input = contactSchema.parse(body);

    if (looksLikeSpamContent(input.message)) {
      return fail("Não conseguimos processar a mensagem. Reescreva sem links, por favor.", 400, {
        message: "Remova os links do texto.",
      });
    }

    const user = await getCurrentUser();

    const message = await prisma.message.create({
      data: {
        userId: user?.id ?? null,
        channel: "SITE",
        direction: "IN",
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        subject: input.subject,
        body: input.message,
      },
      select: { id: true },
    });

    await Promise.all([
      dispatch({
        channel: "EMAIL",
        to: input.email,
        template: "contact_received",
        subject: "Recebemos sua mensagem",
        body:
          `Olá, ${input.name.split(" ")[0]}! Recebemos sua mensagem e respondemos em até 1 dia útil. 🌿\n\n` +
          `Assunto: ${input.subject}\n\n` +
          `Se for urgente, chame no WhatsApp ${site.whatsappLabel} que respondemos na hora.`,
        userId: user?.id,
        refType: "message",
        refId: message.id,
      }),
      dispatch({
        channel: "INTERNO",
        to: site.supportEmail,
        template: "contact_received",
        subject: `Contato pelo site: ${input.subject}`,
        body: `✉️ ${input.name} (${input.email}${input.phone ? ` · ${input.phone}` : ""})\n\n${input.message}`,
        refType: "message",
        refId: message.id,
      }),
    ]);

    return ok({ message: "Mensagem enviada! Respondemos em até 1 dia útil." }, 201);
  } catch (error) {
    return handleError(error, "contact");
  }
}
