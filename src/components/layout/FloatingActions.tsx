"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { site, whatsappLink } from "@/lib/site";

/**
 * Ações persistentes de conversão:
 *  · botão flutuante do WhatsApp (sempre visível);
 *  · chat inteligente;
 *  · barra fixa no mobile com "Agendar agora" e "Assinar plano", que aparece
 *    depois do hero para não competir com os CTAs principais.
 */
export function FloatingActions() {
  const pathname = usePathname();
  const [showBar, setShowBar] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Some nas áreas logadas e no fluxo de checkout, onde competiria com a tarefa.
  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/area-cliente") ||
    pathname.startsWith("/entrar") ||
    pathname.startsWith("/cadastro");

  useEffect(() => {
    const onScroll = () => setShowBar(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (hidden) return null;

  return (
    <>
      {/* Coluna de botões flutuantes */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
        <ChatWidget open={chatOpen} onOpenChange={setChatOpen} />

        {!chatOpen ? (
          <>
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-cinza-200 bg-white text-verde-700 shadow-float transition-transform hover:-translate-y-0.5 hover:text-verde-600"
              aria-label="Abrir chat de atendimento"
            >
              <Icon name="quote" size={20} />
            </button>

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener"
              className="pointer-events-auto group flex items-center gap-0 rounded-full bg-[#25D366] text-white shadow-float transition-all duration-300 hover:gap-2 hover:pr-5"
              style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
              aria-label={`Falar no WhatsApp ${site.whatsappLabel}`}
            >
              <span className="flex h-14 w-14 items-center justify-center">
                <Icon name="whatsapp" size={28} />
              </span>
              <span className="max-w-0 overflow-hidden text-[0.9375rem] font-semibold whitespace-nowrap transition-all duration-300 group-hover:max-w-[9rem]">
                Fale com a gente
              </span>
            </a>
          </>
        ) : null}
      </div>

      {/* Barra fixa de conversão (mobile) */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-cinza-200 bg-white/95 backdrop-blur-xl transition-transform duration-300 sm:hidden ${
          showBar ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          transitionTimingFunction: "var(--ease-out-soft)",
          paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex gap-2.5 px-4 pt-2.5">
          <Link href="/agendamento" className="btn btn-primary btn-md flex-1">
            Agendar agora
          </Link>
          <Link href="/planos" className="btn btn-outline btn-md flex-1">
            Assinar plano
          </Link>
        </div>
      </div>

      {/* Botão "Assinar plano" fixo no desktop */}
      <div
        className={`fixed bottom-6 left-6 z-30 hidden transition-all duration-300 sm:block ${
          showBar ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
      >
        <Link
          href="/planos"
          className="flex items-center gap-2.5 rounded-full border border-cinza-200 bg-white/95 py-3 pr-5 pl-4 text-[0.9375rem] font-semibold text-verde-800 shadow-float backdrop-blur-xl transition-transform hover:-translate-y-0.5"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-verde-200 text-verde-700">
            <Icon name="leaf" size={16} />
          </span>
          Assinar plano
          <span className="text-sm font-normal text-cinza-600">a partir de R$ 450</span>
        </Link>
      </div>
    </>
  );
}
