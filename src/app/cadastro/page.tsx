import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { RegisterForm } from "@/components/forms/AuthForms";
import { Icon } from "@/components/ui/Icon";
import { StarRating } from "@/components/ui/StarRating";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Criar Conta",
  description: "Crie sua conta grátis para agendar serviços, acompanhar o histórico do seu jardim e gerenciar sua assinatura.",
  path: "/cadastro",
});

export default function CadastroPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="flex items-center justify-center px-5 py-24 sm:px-8">
        <div className="w-full max-w-lg">
          <Link href="/" className="inline-block">
            <Logo height={30} />
          </Link>

          <h1 className="mt-10 text-title font-semibold text-verde-800">Criar conta grátis</h1>
          <p className="mt-2.5 text-[0.9375rem] text-cinza-700">
            Leva menos de um minuto. Depois você agenda serviços e acompanha tudo pelo painel.
          </p>

          <div className="mt-8">
            <RegisterForm />
          </div>

          <Link href="/" className="mt-10 inline-flex items-center gap-1.5 text-sm text-cinza-600 hover:text-verde-700">
            <Icon name="chevron-left" size={15} />
            Voltar ao site
          </Link>
        </div>
      </div>

      <div className="bg-mesh-verde relative hidden items-center overflow-hidden px-12 py-24 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "url(/img/textura/folhas.svg)", backgroundSize: "260px" }}
        />
        <div className="relative max-w-md">
          <StarRating value={site.stats.rating} size={20} />
          <p className="mt-6 text-2xl leading-snug font-medium text-white">
            “Assinei o Plano Verde e simplesmente parei de pensar no jardim. A equipe chega no dia combinado e ainda manda
            foto quando termina.”
          </p>
          <p className="mt-6 text-[0.9375rem] text-verde-200">
            Mariana Prado · Campinas, SP
            <span className="mt-0.5 block text-sm text-verde-300">cliente há 2 anos</span>
          </p>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
            <div>
              <dt className="text-2xl font-semibold text-white">{site.stats.clients}</dt>
              <dd className="mt-1 text-sm text-verde-300">clientes</dd>
            </div>
            <div>
              <dt className="text-2xl font-semibold text-white">{site.stats.rating.toString().replace(".", ",")}</dt>
              <dd className="mt-1 text-sm text-verde-300">de nota média</dd>
            </div>
            <div>
              <dt className="text-2xl font-semibold text-white">{site.stats.cities}</dt>
              <dd className="mt-1 text-sm text-verde-300">cidades</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
