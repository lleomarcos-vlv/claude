import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { listCategories, listProducts } from "@/lib/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Catalogo de produtos",
  description:
    "Pães artesanais, bolos, tortas, doces, salgados, cafeteria e kits da Padaria Villa Reis.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts({ search: q?.trim() || undefined }),
  ]);

  return (
    <div className="container-vr py-12 sm:py-16">
      <SectionHeading
        kicker="Catalogo completo"
        title="Nossos produtos"
        description="Tudo o que sai do nosso forno, atualizado todos os dias pela equipe da padaria."
      />

      <form className="mb-8 flex gap-2" action="/produtos">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar pão, bolo, salgado..."
          className="field flex-1"
          aria-label="Buscar produtos"
        />
        <button type="submit" className="btn btn-primary">
          Buscar
        </button>
      </form>

      <div className="scroll-x mb-10">
        <Link
          href="/produtos"
          className={`badge border px-4 py-2 ${
            !q ? "border-espresso bg-espresso text-cream" : "border-line bg-white text-ink"
          }`}
        >
          Todos
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categoria/${category.slug}`}
            className="badge border border-line bg-white px-4 py-2 text-ink transition hover:border-gold"
          >
            {category.emoji ? `${category.emoji} ` : ""}
            {category.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState query={q} />
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

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="card p-12 text-center">
      <p className="font-display text-2xl">Nada encontrado</p>
      <p className="mt-2 text-muted">
        {query
          ? `Não achamos nada para "${query}". Tente outra palavra ou fale com a gente no WhatsApp.`
          : "Ainda não ha produtos cadastrados. O administrador pode cadastrar pelo painel."}
      </p>
      <Link href="/produtos" className="btn btn-outline mt-6">
        Ver todo o catalogo
      </Link>
    </div>
  );
}
