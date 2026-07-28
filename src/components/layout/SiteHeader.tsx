"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { nav, site, whatsappLink } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // A home tem hero escuro: o cabeçalho começa transparente e "solidifica" ao rolar.
  const overHero = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu ao navegar.
  useEffect(() => setOpen(false), [pathname]);

  // Trava o scroll e devolve o foco quando o menu móvel está aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || !overHero || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? "border-b border-cinza-200/80 bg-white/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
      style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-18">
        <Link href="/" aria-label={`${site.name} — página inicial`} className="shrink-0">
          <Logo height={26} variant={solid ? "brand" : "light"} className="sm:h-[30px] w-auto" />
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-[0.9375rem] font-medium transition-colors ${
                  solid
                    ? active
                      ? "bg-verde-50 text-verde-700"
                      : "text-cinza-700 hover:bg-verde-50 hover:text-verde-700"
                    : active
                      ? "bg-white/15 text-white"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener"
            aria-label="Falar no WhatsApp"
            className={`hidden h-10 w-10 items-center justify-center rounded-full transition-colors sm:flex ${
              solid ? "text-verde-600 hover:bg-verde-50" : "text-white hover:bg-white/15"
            }`}
          >
            <Icon name="whatsapp" size={21} />
          </a>

          <Link
            href="/entrar"
            className={`hidden h-10 items-center rounded-full px-4 text-[0.9375rem] font-medium transition-colors md:inline-flex ${
              solid ? "text-verde-700 hover:bg-verde-50" : "text-white/90 hover:bg-white/10 hover:text-white"
            }`}
          >
            Entrar
          </Link>

          <Link href="/agendamento" className="btn btn-primary btn-md hidden sm:inline-flex">
            Agendar serviço
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden ${
              solid ? "text-verde-800 hover:bg-verde-50" : "text-white hover:bg-white/15"
            }`}
          >
            <Icon name={open ? "x" : "menu"} size={22} />
          </button>
        </div>
      </div>

      {/* Menu móvel */}
      <div
        id="menu-mobile"
        ref={panelRef}
        hidden={!open}
        className="border-t border-cinza-200 bg-white lg:hidden"
      >
        <div className="container-page grid gap-1 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-verde-800 hover:bg-verde-50"
            >
              {item.label}
              <Icon name="chevron-right" size={18} className="text-cinza-400" />
            </Link>
          ))}
          <Link
            href="/orcamento"
            className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-verde-800 hover:bg-verde-50"
          >
            Solicitar orçamento
            <Icon name="chevron-right" size={18} className="text-cinza-400" />
          </Link>

          <div className="mt-3 grid gap-2.5 border-t border-cinza-200 pt-4">
            <Link href="/agendamento" className="btn btn-primary btn-lg w-full">
              Agendar serviço
            </Link>
            <Link href="/planos" className="btn btn-outline btn-lg w-full">
              Conhecer planos
            </Link>
            <div className="grid grid-cols-2 gap-2.5">
              <Link href="/entrar" className="btn btn-ghost btn-md w-full border border-cinza-200">
                Entrar
              </Link>
              <a href={whatsappLink()} target="_blank" rel="noopener" className="btn btn-ghost btn-md w-full border border-cinza-200">
                <Icon name="whatsapp" size={18} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
