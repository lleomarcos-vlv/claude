import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { listProducts } from "@/lib/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Ofertas",
  description: "Promoções da semana da Padaria Villa Reis.",
};

export default async function OffersPage() {
  const offers = await listProducts({ onSaleOnly: true });

  return (
    <div className="container-vr py-12 sm:py-16">
      <SectionHeading
        kicker="Enquanto durar"
        title="Ofertas da Villa Reis"
        description="Promoções ativas hoje, atualizadas direto pelo painel da padaria."
      />

      {offers.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-2xl">Nenhuma oferta ativa no momento</p>
          <p className="mt-2 text-muted">
            Assim que uma promoção entrar no ar, ela aparece aqui automaticamente.
          </p>
          <Link href="/produtos" className="btn btn-primary mt-6">
            Ver o catalogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {offers.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
