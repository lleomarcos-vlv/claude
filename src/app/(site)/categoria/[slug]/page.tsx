import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { listCategories, listProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";

export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({ where: { active: true }, select: { slug: true } }).catch(() => []);
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Categoria" };
  return {
    title: category.name,
    description: category.description ?? `${category.name} da Padaria Villa Reis.`,
    alternates: { canonical: `/categoria/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category || !category.active) notFound();

  const [products, categories] = await Promise.all([
    listProducts({ categorySlug: slug }),
    listCategories(),
  ]);

  return (
    <div className="container-vr py-12 sm:py-16">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-crust">
          Início
        </Link>
        <span className="px-2">/</span>
        <Link href="/produtos" className="hover:text-crust">
          Produtos
        </Link>
        <span className="px-2">/</span>
        <span className="text-espresso">{category.name}</span>
      </nav>

      <SectionHeading
        kicker={`${products.length} ${products.length === 1 ? "item" : "itens"}`}
        title={`${category.emoji ? `${category.emoji} ` : ""}${category.name}`}
        description={category.description ?? undefined}
      />

      <div className="scroll-x mb-10">
        {categories.map((item) => (
          <Link
            key={item.id}
            href={`/categoria/${item.slug}`}
            className={`badge border px-4 py-2 ${
              item.slug === slug
                ? "border-espresso bg-espresso text-cream"
                : "border-line bg-white text-ink hover:border-gold"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-2xl">Sem itens nesta categoria por enquanto</p>
          <Link href="/produtos" className="btn btn-outline mt-6">
            Ver todo o catalogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
