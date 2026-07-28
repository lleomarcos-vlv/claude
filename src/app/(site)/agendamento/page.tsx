import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookingWizard } from "@/components/forms/BookingWizard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCurrentUser } from "@/lib/auth";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { serviceBySlug } from "@/content/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Agendar Serviço de Jardinagem Online",
  description:
    "Escolha o serviço, a data e o horário disponíveis e receba a confirmação na hora. Corte de grama, poda, paisagismo e mais — com equipe própria.",
  path: "/agendamento",
});

export default async function AgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string; area?: string }>;
}) {
  const { servico, area } = await searchParams;
  const user = await getCurrentUser();

  const service = servico && serviceBySlug(servico) ? servico : undefined;
  const areaM2 = area && Number.isFinite(Number(area)) ? Number(area) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Agendamento online"
        title="Três toques. Um especialista. Jardim pronto."
        description="Escolha o serviço, veja os horários realmente disponíveis e receba seu protocolo na hora. Sem ligação, sem espera."
        breadcrumb={[{ label: "Agendamento" }]}
      />

      <section className="section">
        <div className="container-page">
          <BookingWizard defaultService={service} defaultArea={areaM2} user={user} />
        </div>
      </section>

      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", path: "/" },
          { name: "Agendamento", path: "/agendamento" },
        ])}
      />
    </>
  );
}
