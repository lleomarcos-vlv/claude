import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConsentReopenButton } from "@/components/layout/CookieConsent";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Política de Cookies",
  description: "O que são cookies, quais usamos na Verde Fixo e como gerenciar suas preferências.",
  path: "/cookies",
});

const rows = [
  { name: "vf_session", type: "Necessário", purpose: "Mantém você autenticado na área do cliente e no painel.", duration: "14 dias" },
  { name: "vf_consent", type: "Necessário", purpose: "Guarda suas preferências de cookies.", duration: "12 meses" },
  { name: "_ga / _ga_*", type: "Medição", purpose: "Google Analytics — entende quais páginas ajudam mais.", duration: "14 meses" },
  { name: "_gid", type: "Medição", purpose: "Google Analytics — distingue usuários por sessão.", duration: "24 horas" },
  { name: "_fbp", type: "Marketing", purpose: "Meta Pixel — mede campanhas e remarketing.", duration: "3 meses" },
];

export default function CookiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Cookies"
        title="Política de Cookies"
        description="Transparência total sobre o que roda no seu navegador — e controle nas suas mãos."
        breadcrumb={[{ label: "Cookies" }]}
      />

      <section className="section">
        <div className="container-narrow">
          <div className="prose-vf">
            <h2>O que são cookies</h2>
            <p>
              Cookies são pequenos arquivos que um site guarda no seu navegador. Alguns são essenciais para o site
              funcionar; outros ajudam a medir o uso e a mostrar anúncios relevantes. Na Verde Fixo, nenhum cookie de
              medição ou marketing é carregado antes do seu consentimento.
            </p>

            <h2>Categorias que usamos</h2>
            <ul>
              <li>
                <strong>Necessários:</strong> sessão, segurança e preferências. Não podem ser desativados porque o site
                não funciona sem eles.
              </li>
              <li>
                <strong>Medição:</strong> Google Analytics, para entender quais conteúdos são mais úteis. Só com seu
                aceite.
              </li>
              <li>
                <strong>Marketing:</strong> Meta Pixel, para remarketing no Instagram e Facebook. Só com seu aceite.
              </li>
            </ul>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-cinza-200">
            <table className="w-full min-w-[38rem] text-left text-[0.9375rem]">
              <thead>
                <tr className="border-b border-cinza-200 bg-cinza-50 text-sm">
                  <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Cookie</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Categoria</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Finalidade</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Duração</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name} className="border-b border-cinza-200 last:border-b-0">
                    <td className="px-5 py-3.5 font-mono text-sm text-verde-800">{row.name}</td>
                    <td className="px-5 py-3.5 text-cinza-700">{row.type}</td>
                    <td className="px-5 py-3.5 text-cinza-700">{row.purpose}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-cinza-700">{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 rounded-2xl border border-verde-300 bg-verde-50 p-6">
            <h2 className="text-lg font-semibold text-verde-800">Gerenciar minhas preferências</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-cinza-700">
              Você pode rever ou alterar sua escolha a qualquer momento. As preferências valem só para este navegador.
            </p>
            <div className="mt-5">
              <ConsentReopenButton />
            </div>
          </div>

          <p className="mt-8 text-[0.9375rem] text-cinza-700">
            Para saber como tratamos os dados coletados, veja a{" "}
            <Link href="/privacidade" className="font-medium text-verde-600 underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
