import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubscribeForm } from "@/components/forms/SubscribeForm";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCurrentUser } from "@/lib/auth";
import { getPlans } from "@/lib/catalog";
import { breadcrumbSchema, pageMetadata, planSchema } from "@/lib/seo";
import { planBySlug, plans } from "@/content/plans";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return plans.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const plan = planBySlug(slug);
  if (!plan) return {};

  return pageMetadata({
    title: `Assinar ${plan.name}`,
    description: `${plan.tagline} A partir de ${money(plan.priceMonthly)} por mês, sem fidelidade.`,
    path: `/assinar/${plan.slug}`,
  });
}

export default async function AssinarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ area?: string }>;
}) {
  const [{ slug }, { area }] = await Promise.all([params, searchParams]);

  const allPlans = await getPlans();
  const plan = allPlans.find((p) => p.slug === slug);
  if (!plan) notFound();

  const user = await getCurrentUser();
  // Assinar exige conta: preserva o destino para voltar depois do login.
  if (!user) redirect(`/entrar?proximo=${encodeURIComponent(`/assinar/${slug}${area ? `?area=${area}` : ""}`)}`);

  const areaM2 = area && Number.isFinite(Number(area)) ? Number(area) : (user.areaM2 ?? undefined);

  return (
    <>
      <PageHeader
        eyebrow="Clube Verde Fixo"
        title={`Assinar o ${plan.name}`}
        description={plan.tagline}
        breadcrumb={[{ label: "Planos", href: "/planos" }, { label: plan.name }]}
      />

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div className="card p-6 sm:p-8">
            <SubscribeForm
              plan={{
                slug: plan.slug,
                name: plan.name,
                priceMonthly: plan.priceMonthly,
                priceYearly: plan.priceYearly,
                areaTiers: plan.areaTiers,
              }}
              defaultArea={areaM2}
              userName={user.name}
            />
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="card overflow-hidden">
              <div className="bg-verde-800 p-6 text-white">
                <p className="text-xs font-semibold tracking-[0.1em] text-verde-300 uppercase">O que está incluído</p>
                <p className="mt-2.5 text-xl font-semibold">{plan.name}</p>
              </div>

              <ul className="space-y-3 p-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verde-100 text-verde-700">
                      <Icon name="check" size={13} strokeWidth={2.6} />
                    </span>
                    <span className="text-[0.9375rem] leading-relaxed text-cinza-800">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2.5 border-t border-cinza-200 bg-verde-50 p-6 text-sm text-cinza-800">
                {[
                  "Sem fidelidade e sem multa de cancelamento",
                  "Pause por até 60 dias por ano sem perder o preço",
                  "Troque de plano quando quiser",
                  "Garantia de satisfação: refazemos em até 72h",
                ].map((item) => (
                  <p key={item} className="flex items-start gap-2.5">
                    <Icon name="shield-check" size={16} className="mt-0.5 shrink-0 text-verde-600" />
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-sm text-cinza-600">
              Prefere falar com alguém antes?{" "}
              <Link href="/orcamento" className="font-medium text-verde-600 underline underline-offset-2">
                Fale com nossa equipe
              </Link>
            </p>
          </aside>
        </div>
      </section>

      <JsonLd
        data={[
          planSchema(plan),
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "Planos", path: "/planos" },
            { name: plan.name, path: `/assinar/${plan.slug}` },
          ]),
        ]}
      />
    </>
  );
}
