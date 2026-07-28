import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SurveyForm } from "@/components/forms/SurveyForm";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { date } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Pesquisa de Satisfação",
  description: "Conte como ficou seu jardim. Sua opinião leva 30 segundos e ajuda muito nossa equipe.",
  path: "/pesquisa",
  noIndex: true,
});

export default async function PesquisaPage({ params }: { params: Promise<{ protocol: string }> }) {
  const { protocol } = await params;

  const booking = await prisma.booking.findUnique({
    where: { protocol: decodeURIComponent(protocol) },
    select: {
      id: true,
      protocol: true,
      serviceName: true,
      scheduledAt: true,
      contactName: true,
      survey: { select: { id: true, rating: true, answeredAt: true } },
    },
  });

  if (!booking) notFound();

  const alreadyAnswered = Boolean(booking.survey?.answeredAt);

  return (
    <>
      <PageHeader
        eyebrow="Pesquisa de satisfação"
        title={alreadyAnswered ? "Obrigado pela sua avaliação!" : `Como ficou seu jardim, ${booking.contactName.split(" ")[0]}?`}
        description={
          alreadyAnswered
            ? "Você já respondeu esta pesquisa. Agradecemos muito o retorno!"
            : `Sobre o serviço de ${booking.serviceName.toLowerCase()} realizado em ${date(booking.scheduledAt)}.`
        }
        breadcrumb={[{ label: "Pesquisa" }]}
      />

      <section className="section">
        <div className="container-narrow">
          {alreadyAnswered ? (
            <div className="card p-8 text-center">
              <p className="text-5xl">🌿</p>
              <p className="mt-4 text-lg font-medium text-verde-800">Sua opinião já está registrada.</p>
              <p className="mt-2 text-[0.9375rem] text-cinza-700">
                Se algo não ficou bom, você ainda tem até 72 horas após o serviço para pedir que refaçamos sem custo.
              </p>
            </div>
          ) : (
            <div className="card p-6 sm:p-8">
              <SurveyForm protocol={booking.protocol} serviceName={booking.serviceName} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
