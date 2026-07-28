import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Proxy (antigo middleware): protege as áreas logadas antes de qualquer renderização.
 *
 * Valida a assinatura do cookie com Web Crypto (compatível com o Edge Runtime),
 * sem tocar no banco. Cada página e handler confirma o usuário no banco depois —
 * este proxy existe para redirecionar cedo, não como única barreira.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  const isAdminArea = pathname.startsWith("/admin");
  const isClientArea = pathname.startsWith("/area-cliente");
  const isAuthPage = pathname === "/entrar" || pathname === "/cadastro";

  // Quem já entrou não precisa ver login/cadastro.
  if (isAuthPage && session) {
    const target = session.role === "ADMIN" || session.role === "STAFF" ? "/admin" : "/area-cliente";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (isAdminArea || isClientArea) {
    if (!session) {
      const login = new URL("/entrar", request.url);
      login.searchParams.set("proximo", pathname + search);
      return NextResponse.redirect(login);
    }

    // Cliente não entra no admin.
    if (isAdminArea && session.role !== "ADMIN" && session.role !== "STAFF") {
      return NextResponse.redirect(new URL("/area-cliente", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/area-cliente/:path*", "/entrar", "/cadastro"],
};
