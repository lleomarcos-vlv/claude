import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Entrar no painel",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center bg-espresso px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo tone="light" brandName={settings.brandName} />
        </div>

        <div className="card p-8">
          <h1 className="font-display text-2xl">Painel administrativo</h1>
          <p className="mt-1 text-sm text-muted">Acesso restrito a equipe da padaria.</p>
          <LoginForm className="mt-6" />
        </div>

        <p className="mt-6 text-center text-xs text-cream/40">
          {settings.brandName} • área protegida
        </p>
      </div>
    </div>
  );
}
