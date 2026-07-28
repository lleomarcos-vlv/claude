import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Painel Verde Fixo", template: "%s | Painel Verde Fixo" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?proximo=/admin");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/area-cliente");

  return (
    <div className="min-h-dvh bg-cinza-50">
      <AdminNav userName={user.name} role={user.role} />

      <div className="lg:pl-64">
        <main className="px-5 pt-20 pb-16 sm:px-8 lg:pt-8">{children}</main>

        <footer className="border-t border-cinza-200 px-5 py-6 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-3 text-sm text-cinza-600 sm:flex-row">
            <Link href="/" className="flex items-center gap-2 hover:text-verde-700">
              <Logo height={16} />
              Ver o site
            </Link>
            <p>Painel administrativo · acesso restrito à equipe</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
