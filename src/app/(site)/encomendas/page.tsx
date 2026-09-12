import type { Metadata } from "next";
import { CustomOrderForm } from "@/components/custom-order-form";
import { SectionHeading } from "@/components/section-heading";
import { listCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Encomendas e orçamentos",
  description:
    "Encomende bolos, tortas, doces, salgados, kits para festa e café da manhã na Padaria Villa Reis.",
};

const FALLBACK_TYPES = [
  "Bolos",
  "Tortas",
  "Doces",
  "Salgados",
  "Kits para festas",
  "Café da manhã",
  "Eventos",
  "Produtos personalizados",
];

export default async function CustomOrdersPage() {
  const [categories, settings] = await Promise.all([
    listCategories({ onlyOrders: true }),
    getSettings(),
  ]);

  const types = categories.length > 0 ? categories.map((category) => category.name) : FALLBACK_TYPES;

  return (
    <div className="container-vr py-12 sm:py-16">
      <SectionHeading
        kicker="Festa, evento ou aquele domingo especial"
        title="Encomendas"
        description="Conte o que você precisa e a gente devolve o orçamento pelo WhatsApp. Quanto mais detalhes, mais rápido."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <aside className="card h-fit p-8">
          <h2 className="font-display text-xl">O que a Villa Reis prepara</h2>
          <ul className="mt-4 grid gap-2 text-sm text-muted">
            {types.map((type) => (
              <li key={type} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {type}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl bg-cream-deep p-5 text-sm leading-relaxed text-muted">
            <p className="font-semibold text-espresso">Prazo</p>
            <p className="mt-1">
              Bolos e tortas: a partir de 48h. Kits e eventos: a partir de 5 dias. Para datas
              comemorativas, quanto antes melhor.
            </p>
          </div>
        </aside>

        <CustomOrderForm types={types} brandName={settings.brandName} />
      </div>
    </div>
  );
}
