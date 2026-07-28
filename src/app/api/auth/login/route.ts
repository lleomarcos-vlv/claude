import { prisma } from "@/lib/db";
import { setSessionCookie, verifyPassword, type Role } from "@/lib/auth";
import { fail, guard, handleError, ok, readJson } from "@/lib/api";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);

    // Limite mais apertado: é o alvo natural de força bruta.
    const blocked = await guard(request, "login", body, { limit: 8, windowMs: 10 * 60_000 });
    if (blocked) return blocked;

    const input = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, name: true, email: true, role: true, passwordHash: true, active: true },
    });

    // Mensagem única para e-mail inexistente e senha errada (não revela cadastros).
    const invalid = fail("E-mail ou senha incorretos.", 401);
    if (!user || !user.active) {
      // Gasta tempo comparável ao caminho válido para não vazar por timing.
      await verifyPassword(input.password, "scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAA");
      return invalid;
    }

    if (!(await verifyPassword(input.password, user.passwordHash))) return invalid;

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await setSessionCookie({ sub: user.id, role: user.role as Role, name: user.name });

    const redirect = user.role === "ADMIN" || user.role === "STAFF" ? "/admin" : "/area-cliente";
    return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, redirect });
  } catch (error) {
    return handleError(error, "auth/login");
  }
}
