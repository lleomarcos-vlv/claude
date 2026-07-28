import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { CookieConsent } from "@/components/layout/CookieConsent";

/**
 * Layout do site institucional: cabeçalho, rodapé, botões flutuantes e banner de
 * cookies. As áreas logadas (admin, área do cliente) e as telas de autenticação
 * ficam fora deste grupo de rotas e têm o próprio layout — por isso não herdam
 * nada deste chrome.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter />

      <FloatingActions />
      <CookieConsent />
    </>
  );
}
