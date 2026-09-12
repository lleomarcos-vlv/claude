import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticate,
  loginThrottleCheck,
  loginThrottleRegisterFailure,
  loginThrottleReset,
} from "@/lib/auth";
import { clientIp, handleError, jsonError, parseBody } from "@/lib/api";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

const schema = z.object({
  email: z.string().email("informe um e-mail valido"),
  password: z.string().min(1, "informe a senha"),
});

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const throttle = loginThrottleCheck(ip);
    if (!throttle.allowed) {
      return jsonError(
        `Muitas tentativas. Tente novamente em ${throttle.retryInMin} minuto(s).`,
        429,
      );
    }

    const body = await parseBody(request, schema);
    const user = await authenticate(body.email, body.password);
    if (!user) {
      loginThrottleRegisterFailure(ip);
      return jsonError("E-mail ou senha incorretos.", 401);
    }

    loginThrottleReset(ip);
    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({ ok: true, data: { name: user.name } });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    return handleError(error);
  }
}
