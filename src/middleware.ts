import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Bloqueia /admin e /api/admin para quem não tem sessão valida.
 * Roda antes de qualquer página ser renderizada.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/admin") && !session) {
    return NextResponse.json(
      { ok: false, error: "Sessão expirada. Faca login novamente." },
      { status: 401 },
    );
  }

  if (pathname.startsWith("/admin") && !isLoginPage && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginPage && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
