"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";

const MENU = [
  { href: "/admin", label: "Painel", icon: "▦" },
  { href: "/admin/produtos", label: "Produtos", icon: "🥐" },
  { href: "/admin/categorias", label: "Categorias", icon: "🗂" },
  { href: "/admin/banners", label: "Banners", icon: "🖼" },
  { href: "/admin/promocoes", label: "Promoções", icon: "🏷" },
  { href: "/admin/galeria", label: "Galeria e Instagram", icon: "📸" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🧾" },
  { href: "/admin/encomendas", label: "Encomendas", icon: "🎂" },
  { href: "/admin/mensagens", label: "Mensagens", icon: "✉️" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "⚙️" },
];

export function AdminShell({
  children,
  userName,
  brandName,
}: {
  children: React.ReactNode;
  userName: string;
  brandName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="relative z-10 flex min-h-screen bg-cream">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 -translate-x-full overflow-y-auto bg-espresso p-5 text-cream transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <Link href="/admin" className="block">
          <Logo tone="light" brandName={brandName} />
        </Link>

        <p className="mt-6 text-[0.65rem] uppercase tracking-[0.2em] text-cream/40">Gestão</p>
        <nav className="mt-3 space-y-1">
          {MENU.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? "bg-cream text-espresso" : "text-cream/75 hover:bg-cream/10"
                }`}
              >
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-cream/15 pt-5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-cream/70 transition hover:bg-cream/10"
          >
            ↗ Ver o site
          </Link>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-cream/70 transition hover:bg-cream/10"
          >
            ⎋ Sair
          </button>
          <p className="mt-4 px-3 text-xs text-cream/40">Conectado como {userName}</p>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-espresso/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-cream/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white"
            aria-label="Abrir menu"
          >
            ☰
          </button>
          <span className="font-display text-lg">Painel Villa Reis</span>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
