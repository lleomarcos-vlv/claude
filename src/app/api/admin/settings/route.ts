import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, verifyPassword } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/security";
import { listSettingsForAdmin, saveSettings, settingDefinitions } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Configuração das integrações (Mercado Pago, Stripe, WhatsApp, medição…).
 *
 * Duas travas:
 *  1. sessão com papel ADMIN — STAFF não altera credenciais de pagamento;
 *  2. reconfirmação da senha do administrador em cada gravação (step-up auth),
 *     para que uma sessão esquecida aberta não permita trocar as chaves.
 *
 * A resposta do GET nunca traz um segredo íntegro: apenas prévia mascarada,
 * se está configurado e de onde o valor vem (banco ou ambiente).
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (admin.role !== "ADMIN") return fail("Apenas administradores acessam as integrações.", 403);

    return ok({ settings: await listSettingsForAdmin() });
  } catch (error) {
    return handleError(error, "admin/settings:get");
  }
}

const allowedKeys = new Set(settingDefinitions.map((d) => d.key));

const putSchema = z.object({
  password: z.string().min(1, "Confirme sua senha para salvar."),
  // Aceita um subconjunto das chaves; `saveSettings` ignora o que não conhece.
  values: z
    .record(z.string(), z.string().max(500))
    .transform((obj) => Object.fromEntries(Object.entries(obj).filter(([key]) => allowedKeys.has(key)))),
});

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    if (admin.role !== "ADMIN") return fail("Apenas administradores alteram as integrações.", 403);

    // Trava contra tentativa de adivinhar a senha por este endpoint.
    const limited = rateLimit(`admin-settings:${clientIp(request)}`, 10, 10 * 60_000);
    if (!limited.ok) return fail("Muitas tentativas. Aguarde alguns minutos.", 429);

    const input = putSchema.parse(await readJson(request));

    const record = await prisma.user.findUnique({ where: { id: admin.id }, select: { passwordHash: true } });
    if (!record || !(await verifyPassword(input.password, record.passwordHash))) {
      return fail("Senha incorreta.", 401, { password: "Senha incorreta." });
    }

    // Campos vazios são ignorados: enviar em branco não apaga o segredo já salvo.
    // Para remover, envie a string "__limpar__".
    const entries: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.values)) {
      if (value === "__limpar__") entries[key] = "";
      else if (value.trim() !== "") entries[key] = value;
    }

    if (!Object.keys(entries).length) {
      return ok({ saved: 0, settings: await listSettingsForAdmin(), message: "Nada para salvar." });
    }

    const saved = await saveSettings(entries);

    return ok({
      saved,
      settings: await listSettingsForAdmin(),
      message: `${saved} ${saved === 1 ? "configuração salva" : "configurações salvas"} com sucesso.`,
    });
  } catch (error) {
    return handleError(error, "admin/settings:put");
  }
}
