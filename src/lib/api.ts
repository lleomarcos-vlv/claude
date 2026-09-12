import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ZodError, type ZodType } from "zod";
import { getSession } from "./auth";

export function jsonOk<T>(data: T, init?: number) {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Envolve handlers de /api/admin/*: exige sessão valida e trata erros. */
export function adminHandler<T>(
  handler: (context: { session: NonNullable<Awaited<ReturnType<typeof getSession>>> }) => Promise<T>,
) {
  return async () => {
    const session = await getSession();
    if (!session) return jsonError("Sessão expirada. Faca login novamente.", 401);
    try {
      return (await handler({ session })) as T;
    } catch (error) {
      return handleError(error);
    }
  };
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return jsonError(first ? `${first.path.join(".")}: ${first.message}` : "Dados inválidos", 422);
  }
  if (error instanceof Error) {
    if (error.message.includes("Unique constraint")) {
      return jsonError("Já existe um registro com esse identificador (slug ou código).", 409);
    }
    console.error("[api]", error);
    return jsonError(error.message || "Erro inesperado", 500);
  }
  console.error("[api]", error);
  return jsonError("Erro inesperado", 500);
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const raw = await request.json().catch(() => ({}));
  return schema.parse(raw);
}

/** Inválida o cache das páginas publicas após qualquer alteração no painel. */
export function revalidatePublic(extra: string[] = []) {
  const paths = [
    "/",
    "/produtos",
    "/ofertas",
    "/café",
    "/encomendas",
    "/contato",
    "/sitemap.xml",
    ...extra,
  ];
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      /* fora de contexto de request */
    }
  }
  try {
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/produtos/[slug]", "page");
  } catch {
    /* ignora */
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconhecido";
}
