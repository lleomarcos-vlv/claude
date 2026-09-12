"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart-context";

const TABS = [
  { href: "/", label: "Início", icon: "home" },
  { href: "/produtos", label: "Produtos", icon: "bread" },
  { href: "/carrinho", label: "Pedido", icon: "cart" },
  { href: "/encomendas", label: "Encomendas", icon: "cake" },
  { href: "/contato", label: "Contato", icon: "pin" },
] as const;

/** Navegação principal no celular: sempre visivel, com o carrinho a um toque. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { count } = useCart();

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-line pt-2 lg:hidden">
      <ul className="flex items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 px-1 py-1 text-[0.65rem] font-medium transition ${
                  active ? "text-crust" : "text-muted"
                }`}
              >
                <span className="relative">
                  <TabIcon name={tab.icon} active={active} />
                  {tab.icon === "cart" && count > 0 ? (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crust px-1 text-[0.6rem] font-bold text-white">
                      {count}
                    </span>
                  ) : null}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? 2 : 1.6;
  const common = { className: "h-[22px] w-[22px]", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1Z" />
        </svg>
      );
    case "bread":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 11c0-3 3.1-5 8-5s8 2 8 5c0 1.3-1 2-2 2v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4c-1 0-2-.7-2-2Z" />
          <path d="M9.5 8.5 8 13M14.5 8.5 13 13" />
        </svg>
      );
    case "cart":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M3 5h2l2.2 10.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.55L20 8H6" />
          <circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "cake":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 20h16v-5c0-1.7-1.3-3-3-3H7c-1.7 0-3 1.3-3 3Z" />
          <path d="M12 12V8M9 8V6M15 8V6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
      );
  }
}
