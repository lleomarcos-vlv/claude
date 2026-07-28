import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { BeforeAfterGallery } from "@/components/sections/BeforeAfter";
import { CtaBanner } from "@/components/sections/WhyChooseUs";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { gallery } from "@/content/gallery";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Antes e Depois — Trabalhos Realizados",
  description:
    "Galeria de trabalhos reais da Verde Fixo: paisagismo, corte de grama, revitalização, poda e limpeza de terreno. Arraste e compare o antes e o depois.",
  path: "/antes-e-depois",
  image: gallery[0].after,
});

export default function AntesEDepoisPage() {
  return (
    <>
      <PageHeader
        eyebrow="Antes e depois"
        title="Trabalhos realizados pela nossa equipe"
        description="Arraste a alça de cada imagem e compare. São jardins reais na região de Campinas — nada de banco de imagens."
        breadcrumb={[{ label: "Antes e depois" }]}
      />

      <section className="section">
        <div className="container-page">
          <BeforeAfterGallery items={gallery} filterable />
        </div>
      </section>

      <CtaBanner
        title="Seu jardim pode ser o próximo"
        description="Peça um orçamento gratuito e veja o que é possível fazer no seu espaço."
        primary={{ href: "/orcamento", label: "Pedir orçamento" }}
        secondary={{ href: "/agendamento", label: "Agendar serviço" }}
      />

      <JsonLd
        data={[
          {
            "@type": "ImageGallery",
            "@id": `${siteUrl}/antes-e-depois#galeria`,
            name: "Antes e depois — Verde Fixo",
            description: "Trabalhos de jardinagem e paisagismo realizados pela Verde Fixo.",
            image: gallery.map((g) => `${siteUrl}${g.after}`),
          },
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "Antes e depois", path: "/antes-e-depois" },
          ]),
        ]}
      />
    </>
  );
}
