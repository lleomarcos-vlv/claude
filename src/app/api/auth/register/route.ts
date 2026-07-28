import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie, type Role } from "@/lib/auth";
import { fail, guard, handleError, ok, readJson } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { dispatch } from "@/lib/notifications";
import { site } from "@/lib/site";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);

    const blocked = await guard(request, "register", body, { limit: 5, windowMs: 10 * 60_000, captcha: true });
    if (blocked) return blocked;

    const input = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (existing) {
      return fail("Este e-mail já tem cadastro. Faça login ou recupere a senha.", 409, {
        email: "E-mail já cadastrado.",
      });
    }

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        whatsapp: input.whatsapp || input.phone,
        passwordHash: await hashPassword(input.password),
        role: "CLIENT",
        city: input.city || null,
        propertyType: input.propertyType ?? null,
        areaM2: input.areaM2 ?? null,
        marketingOptIn: input.marketingOptIn ?? false,
        lgpdAcceptedAt: new Date(),
        lastLoginAt: new Date(),
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    await setSessionCookie({ sub: user.id, role: user.role as Role, name: user.name });

    // Boas-vindas — não bloqueia a resposta se a integração falhar.
    void dispatch({
      channel: "EMAIL",
      to: user.email,
      template: "welcome",
      subject: `Bem-vindo à ${site.name}!`,
      body:
        `Olá, ${user.name.split(" ")[0]}! Sua conta na ${site.name} está pronta. 🌿\n\n` +
        `No seu painel você acompanha próximos serviços, histórico com fotos antes e depois, faturas e sua assinatura:\n` +
        `${site.url}/area-cliente\n\n` +
        `Qualquer dúvida, responda este e-mail ou chame no WhatsApp ${site.whatsappLabel}.`,
      userId: user.id,
    });

    return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 201);
  } catch (error) {
    return handleError(error, "auth/register");
  }
}
