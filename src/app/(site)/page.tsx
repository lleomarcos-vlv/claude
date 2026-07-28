import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { PlansSection } from "@/components/sections/PlansSection";
import { SimulatorSection } from "@/components/sections/Simulator";
import { BeforeAfterSection } from "@/components/sections/BeforeAfter";
import { WhyChooseUs, AudienceStrip, CtaBanner } from "@/components/sections/WhyChooseUs";
import { Testimonials } from "@/components/sections/Testimonials";
import { CoverageSection } from "@/components/sections/CoverageMap";
import { FaqSection } from "@/components/sections/Faq";
import { BlogTeaser } from "@/components/sections/BlogTeaser";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPlans, getServiceAreas, getServices } from "@/lib/catalog";
import { faqSchema, pageMetadata, planSchema } from "@/lib/seo";
import { faqHome } from "@/content/faq";
import { testimonials } from "@/content/testimonials";
import { beforeAfterFeatured } from "@/content/gallery";
import { recentPosts } from "@/content/blog";
import { site } from "@/lib/site";

/** Revalida a cada 10 min: preços do admin entram em produção sem novo deploy. */
export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: `${site.name} — Corte de Grama, Paisagismo e Manutenção de Jardins`,
  description:
    "Cuidamos do seu jardim o ano inteiro. Agende corte de grama, paisagismo, poda ou limpeza de terreno online, ou assine o Clube Verde Fixo a partir de R$ 450/mês. Equipe própria e garantia de satisfação.",
  path: "/",
  keywords: [
    "corte de grama",
    "jardinagem Campinas",
    "paisagismo residencial",
    "plano de manutenção de jardim",
    "assinatura de jardinagem",
    "limpeza de terreno",
  ],
});

export default async function HomePage() {
  const [services, plans, cities] = await Promise.all([getServices(), getPlans(), getServiceAreas()]);

  return (
    <>
      <Hero />
      <AudienceStrip />
      <HowItWorks />
      <ServicesGrid services={services} limit={6} />
      <PlansSection plans={plans} showComparison={false} />
      <SimulatorSection />
      <BeforeAfterSection items={beforeAfterFeatured} />
      <WhyChooseUs />
      <Testimonials items={testimonials} limit={6} />
      <CoverageSection cities={cities} />
      <BlogTeaser posts={recentPosts} />
      <FaqSection items={faqHome} />
      <CtaBanner />

      <JsonLd data={[...plans.map(planSchema), faqSchema(faqHome)]} />
    </>
  );
}
