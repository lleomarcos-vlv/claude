import { prisma } from "@/lib/db";
import { guard, handleError, ok, readJson } from "@/lib/api";
import { newsletterSchema } from "@/lib/validation";
import { dispatch } from "@/lib/notifications";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);

    // Sem captcha: campo de baixo risco. Rate limit + honeypot dão conta.
    const blocked = await guard(request, "newsletter", body, { limit: 8, windowMs: 10 * 60_000 });
    if (blocked) return blocked;

    const input = newsletterSchema.parse(body);

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: input.email },
      select: { id: true, active: true },
    });

    if (existing?.active) {
      // Idempotente: reinscrever não é erro para o usuário.
      return ok({ message: "Você já está na nossa lista. Boas dicas chegando todo mês!" });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: input.email },
      create: { email: input.email, name: input.name || null, source: input.source ?? "site", confirmed: true, active: true },
      update: { active: true, unsubscribedAt: null, confirmed: true },
    });

    void dispatch({
      channel: "EMAIL",
      to: input.email,
      template: "newsletter_welcome",
      subject: "Suas dicas de jardinagem começam agora 🌿",
      body:
        `Obrigado por assinar as dicas da ${site.name}!\n\n` +
        `Uma vez por mês você recebe o que fazer no jardim naquela estação — escrito pelo nosso agrônomo, sem enrolação.\n\n` +
        `Enquanto isso, dois artigos que a maioria dos clientes lê primeiro:\n` +
        `· Com que frequência cortar a grama: ${site.url}/blog/com-que-frequencia-cortar-a-grama\n` +
        `· Quanto custa manter um jardim: ${site.url}/blog/quanto-custa-manter-um-jardim\n\n` +
        `Para cancelar, responda este e-mail com "sair".`,
    });

    return ok({ message: "Inscrição confirmada. Enviamos um e-mail de boas-vindas." }, 201);
  } catch (error) {
    return handleError(error, "newsletter");
  }
}
