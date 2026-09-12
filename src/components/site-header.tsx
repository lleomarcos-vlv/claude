"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { useCart } from "./cart-context";
import { NAV_ITEMS } from "./nav-items";



export function SiteHeader({ brandName }: { brandName: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-line shadow-[0_10px_30px_-24px_rgba(36,22,9,0.6)]" : ""
      }`}
    >
      <div className="container-vr flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" aria-label={brandName}>
          <Logo brandName={brandName} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-espresso text-cream" : "text-ink hover:bg-sand/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/carrinho"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white transition hover:border-gold"
            aria-label={`Carrinho com ${count} item(ns)`}
          >
            <CartIcon />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-crust px-1 text-[0.65rem] font-bold text-white">
                {count}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={open}
          >
            <span className="flex flex-col gap-[5px]">
              <span className="block h-[2px] w-5 bg-espresso" />
              <span className="block h-[2px] w-5 bg-espresso" />
              <span className="block h-[2px] w-3 bg-espresso" />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="glass border-t border-line lg:hidden">
          <nav className="container-vr flex flex-col py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-line/60 py-3 font-display text-lg text-espresso last:border-0"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 5h2l2.2 10.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.55L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
