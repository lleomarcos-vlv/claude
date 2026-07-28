import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/forms/AuthForms";
import { Icon } from "@/components/ui/Icon";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Entrar na Área do Cliente",
  description: "Acesse seu painel para ver próximos serviços, histórico com fotos, faturas e sua assinatura.",
  path: "/entrar",
  noIndex: true,
});

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ proximo?: string }> }) {
  const { proximo } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Formulário */}
      <div className="flex items-center justify-center px-5 py-24 sm:px-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-block">
            <Logo height={30} />
          </Link>

          <h1 className="mt-10 text-title font-semibold text-verde-800">Bem-vindo de volta</h1>
          <p className="mt-2.5 text-[0.9375rem] text-cinza-700">
            Acesse seu painel para acompanhar serviços, fotos e faturas.
          </p>

          <div className="mt-8">
            <LoginForm next={proximo} />
          </div>

          <Link href="/" className="mt-10 inline-flex items-center gap-1.5 text-sm text-cinza-600 hover:text-verde-700">
            <Icon name="chevron-left" size={15} />
            Voltar ao site
          </Link>
        </div>
      </div>

      {/* Painel de valor */}
      <div className="bg-mesh-verde relative hidden items-center overflow-hidden px-12 py-24 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "url(/img/textura/folhas.svg)", backgroundSize: "260px" }}
        />
        <div className="relative max-w-md">
          <h2 className="text-display font-semibold text-white">Tudo do seu jardim em um lugar</h2>
          <ul className="mt-10 space-y-5">
            {[
              { icon: "calendar", title: "Próximos serviços", text: "Data, horário e a equipe que vai atender." },
              { icon: "image", title: "Fotos antes e depois", text: "Registro de cada visita, sempre disponível." },
              { icon: "wallet", title: "Faturas e pagamentos", text: "Histórico completo e status de cada cobrança." },
              { icon: "leaf", title: "Sua assinatura", text: "Altere, pause ou cancele em dois cliques." },
            ].map((item) => (
              <li key={item.title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-verde-300">
                  <Icon name={item.icon} size={21} />
                </span>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-verde-200">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
