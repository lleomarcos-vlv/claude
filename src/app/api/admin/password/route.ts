import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z
      .string()
      .min(10, "Use pelo menos 10 caracteres na nova senha.")
      .max(200)
      .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v), "Combine maiúsculas, minúsculas e números."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "A nova senha precisa ser diferente da atual.",
    path: ["newPassword"],
  });

/** Troca a senha da conta logada (usada pelo administrador em Configurações → Segurança). */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    const limited = rateLimit(`admin-password:${clientIp(request)}`, 6, 15 * 60_000);
    if (!limited.ok) return fail("Muitas tentativas. Aguarde alguns minutos.", 429);

    const input = schema.parse(await readJson(request));

    const record = await prisma.user.findUnique({ where: { id: admin.id }, select: { passwordHash: true } });
    if (!record || !(await verifyPassword(input.currentPassword, record.passwordHash))) {
      return fail("Senha atual incorreta.", 401, { currentPassword: "Senha atual incorreta." });
    }

    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: await hashPassword(input.newPassword) },
    });

    return ok({ message: "Senha alterada. Use a nova senha nos próximos acessos e ao salvar integrações." });
  } catch (error) {
    return handleError(error, "admin/password");
  }
}
