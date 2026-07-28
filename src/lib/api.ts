import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError } from "@/lib/auth";
import { clientIp, isLikelySpam, rateLimit, verifyCaptcha } from "@/lib/security";
import { fieldErrors } from "@/lib/validation";

/** Resposta de sucesso padronizada. */
export function ok<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

/** Resposta de erro padronizada. `fields` alimenta os erros por campo no formulário. */
export function fail(error: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json({ ok: false, error, ...(fields ? { fields } : {}) }, { status });
}

/** Converte exceções conhecidas em respostas HTTP; o resto vira 500 sem vazar detalhes. */
export function handleError(error: unknown, context: string) {
  if (error instanceof AuthError) return fail(error.message, error.status);
  if (error instanceof z.ZodError) return fail("Confira os campos destacados.", 422, fieldErrors(error));

  console.error(`[api:${context}]`, error);
  return fail("Não foi possível concluir a operação. Tente novamente em instantes.", 500);
}

type GuardOptions = {
  /** Requisições permitidas por janela, por IP. */
  limit: number;
  /** Tamanho da janela em ms. */
  windowMs: number;
  /** Exige captcha + honeypot + time trap (formulários públicos). */
  captcha?: boolean;
};

/**
 * Barreira comum dos endpoints públicos: rate limit por IP, honeypot,
 * time trap e captcha. Retorna `null` quando está tudo certo.
 */
export async function guard(
  request: Request,
  route: string,
  body: Record<string, unknown>,
  options: GuardOptions,
) {
  const ip = clientIp(request);
  const limited = rateLimit(`${route}:${ip}`, options.limit, options.windowMs);

  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas. Aguarde um instante e tente de novo." },
      { status: 429, headers: { "retry-after": String(limited.retryAfter) } },
    );
  }

  if (isLikelySpam({ honeypot: body.honeypot, renderedAt: body.renderedAt })) {
    // Devolvemos 200 para não ensinar o bot qual sinal o pegou.
    return NextResponse.json({ ok: true, message: "Recebido." });
  }

  if (options.captcha) {
    const valid = await verifyCaptcha(body.captchaToken as string | undefined, body.captchaAnswer as string | undefined);
    if (!valid) {
      return fail("Verificação de segurança incorreta. Tente a nova pergunta.", 400, {
        captchaAnswer: "Resposta incorreta.",
      });
    }
  }

  return null;
}

/** Lê o corpo JSON com proteção contra payload malformado. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const data = await request.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
