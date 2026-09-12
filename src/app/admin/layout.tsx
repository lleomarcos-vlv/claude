import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Painel administrativo",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Sem sessão, a única página alcancavel aqui e o login (o middleware cuida do resto).
  if (!session) return <>{children}</>;

  const settings = await getSettings();

  return (
    <AdminShell userName={session.name} brandName={settings.brandName}>
      {children}
    </AdminShell>
  );
}
