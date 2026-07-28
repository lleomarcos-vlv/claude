"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";

const groups: { title: string; items: { href: string; label: string; icon: string; adminOnly?: boolean }[] }[] = [
  {
    title: "Visão geral",
    items: [{ href: "/admin", label: "Dashboard", icon: "dashboard" }],
  },
  {
    title: "Operação",
    items: [
      { href: "/admin/agenda", label: "Agenda", icon: "calendar" },
      { href: "/admin/agendamentos", label: "Agendamentos", icon: "list" },
      { href: "/admin/orcamentos", label: "Orçamentos", icon: "receipt" },
      { href: "/admin/mensagens", label: "Mensagens", icon: "mail" },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { href: "/admin/clientes", label: "Clientes", icon: "users" },
      { href: "/admin/funcionarios", label: "Funcionários", icon: "team" },
      { href: "/admin/servicos", label: "Serviços e preços", icon: "leaf" },
      { href: "/admin/planos", label: "Planos", icon: "tag" },
      { href: "/admin/cupons", label: "Cupons", icon: "ticket" },
      { href: "/admin/areas", label: "Áreas atendidas", icon: "map" },
    ],
  },
  {
    title: "Configuração",
    items: [
      { href: "/admin/integracoes", label: "Integrações", icon: "settings", adminOnly: true },
      { href: "/admin/configuracoes", label: "Segurança", icon: "lock", adminOnly: true },
    ],
  },
];

export function AdminNav({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.adminOnly || role === "ADMIN") }))
    .filter((g) => g.items.length);

  return (
    <>
      {/* Barra superior (mobile) */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-cinza-200 bg-white px-5 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Logo height={22} />
          <span className="rounded-full bg-verde-100 px-2 py-0.5 text-xs font-semibold text-verde-700">Painel</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="flex h-10 w-10 items-center justify-center rounded-full text-verde-800 hover:bg-verde-50"
        >
          <Icon name={open ? "x" : "menu"} size={22} />
        </button>
      </div>

      {/* Barra lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-cinza-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0 pt-16 lg:pt-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
      >
        <div className="flex h-full flex-col">
          <div className="hidden items-center gap-2.5 border-b border-cinza-200 px-5 py-5 lg:flex">
            <Link href="/admin">
              <Logo height={24} />
            </Link>
            <span className="rounded-full bg-verde-100 px-2 py-0.5 text-xs font-semibold text-verde-700">Painel</span>
          </div>

          <nav aria-label="Navegação do painel" className="flex-1 overflow-y-auto px-3 py-4">
            {visible.map((group) => (
              <div key={group.title} className="mb-5">
                <p className="px-3 pb-2 text-[0.7rem] font-semibold tracking-[0.1em] text-cinza-500 uppercase">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] transition-colors ${
                            active ? "bg-verde-50 font-medium text-verde-700" : "text-cinza-700 hover:bg-cinza-50"
                          }`}
                        >
                          <Icon name={item.icon} size={18} className={active ? "text-verde-600" : "text-cinza-500"} />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-cinza-200 p-3">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-verde-600 text-sm font-semibold text-white">
                {userName
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-verde-800">{userName}</p>
                <p className="text-xs text-cinza-600">{role === "ADMIN" ? "Administrador" : "Equipe"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] text-cinza-700 hover:bg-cinza-50"
            >
              <Icon name="logout" size={18} className="text-cinza-500" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-verde-900/25 lg:hidden"
        />
      ) : null}
    </>
  );
}
